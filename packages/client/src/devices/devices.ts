import {
  concatMap,
  debounceTime,
  from,
  fromEvent,
  map,
  merge,
  shareReplay,
  startWith,
  tap,
} from 'rxjs';
import { BrowserPermission } from './BrowserPermission';
import { lazy } from '../helpers/lazy';
import { isFirefox } from '../helpers/browsers';
import { dumpStream, Tracer } from '../stats';
import { getCurrentValue } from '../store/rxUtils';
import { videoLoggerSystem } from '../logger';

/**
 * Returns an Observable that emits the list of available devices
 * that meet the given constraints.
 *
 * @param permission a BrowserPermission instance.
 * @param kind the kind of devices to enumerate.
 * @param tracer the tracer to use for tracing the device enumeration.
 */
const getDevices = (
  permission: BrowserPermission,
  kind: MediaDeviceKind,
  tracer: Tracer | undefined,
) => {
  return from(
    (async () => {
      let devices = await navigator.mediaDevices.enumerateDevices();
      // for privacy reasons, most browsers don't give you device labels
      // unless you have a corresponding camera or microphone permission
      const shouldPromptForBrowserPermission = devices.some(
        (device) => device.kind === kind && device.label === '',
      );
      if (shouldPromptForBrowserPermission && (await permission.prompt())) {
        devices = await navigator.mediaDevices.enumerateDevices();
      }
      tracer?.traceOnce(
        'device-enumeration',
        'navigator.mediaDevices.enumerateDevices',
        devices,
      );
      return devices.filter(
        (device) =>
          device.kind === kind &&
          device.label !== '' &&
          device.deviceId !== 'default',
      );
    })(),
  );
};

/**
 * Tells if the browser supports audio output change on 'audio' elements,
 * see https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId.
 */
export const checkIfAudioOutputChangeSupported = () => {
  if (typeof document === 'undefined') return false;
  const element = document.createElement('audio');
  return 'setSinkId' in element;
};

/**
 * The default constraints used to request audio devices.
 */
const audioDeviceConstraints = {
  audio: {
    autoGainControl: true,
    noiseSuppression: true,
    echoCancellation: true,
  },
} satisfies MediaStreamConstraints;

/**
 * The default constraints used to request video devices.
 */
const videoDeviceConstraints = {
  video: {
    width: 1280,
    height: 720,
  },
} satisfies MediaStreamConstraints;

/**
 * Keeps track of the browser permission to use microphone. This permission also
 * affects an ability to enumerate audio devices.
 */
export const getAudioBrowserPermission = lazy(
  () =>
    new BrowserPermission({
      constraints: audioDeviceConstraints,
      queryName: 'microphone' as PermissionName,
    }),
);

/**
 * Keeps track of the browser permission to use camera. This permission also
 * affects an ability to enumerate video devices.
 */
export const getVideoBrowserPermission = lazy(
  () =>
    new BrowserPermission({
      constraints: videoDeviceConstraints,
      queryName: 'camera' as PermissionName,
    }),
);

const getDeviceChangeObserver = lazy((tracer: Tracer | undefined) => {
  // 'addEventListener' is not available in React Native, returning
  // an observable that will never fire
  if (!navigator.mediaDevices.addEventListener) return from([]);
  return fromEvent(navigator.mediaDevices, 'devicechange').pipe(
    tap(() => tracer?.resetTrace('device-enumeration')),
    map(() => undefined),
    debounceTime(500),
  );
});

/**
 * Prompts the user for a permission to use audio devices (if not already granted
 * and was not prompted before) and lists the available 'audioinput' devices,
 * if devices are added/removed the list is updated, and if the permission is revoked,
 * the observable errors.
 */
export const getAudioDevices = lazy((tracer?: Tracer) => {
  return merge(
    getDeviceChangeObserver(tracer),
    getAudioBrowserPermission().asObservable(),
  ).pipe(
    startWith(undefined),
    concatMap(() =>
      getDevices(getAudioBrowserPermission(), 'audioinput', tracer),
    ),
    shareReplay(1),
  );
});

/**
 * Prompts the user for a permission to use video devices (if not already granted
 * and was not prompted before) and lists the available 'videoinput' devices,
 * if devices are added/removed the list is updated, and if the permission is revoked,
 * the observable errors.
 */
export const getVideoDevices = lazy((tracer?: Tracer) => {
  return merge(
    getDeviceChangeObserver(tracer),
    getVideoBrowserPermission().asObservable(),
  ).pipe(
    startWith(undefined),
    concatMap(() =>
      getDevices(getVideoBrowserPermission(), 'videoinput', tracer),
    ),
    shareReplay(1),
  );
});

/**
 * Prompts the user for a permission to use video devices (if not already granted
 * and was not prompted before) and lists the available 'audiooutput' devices,
 * if devices are added/removed the list is updated, and if the permission is revoked,
 * the observable errors.
 */
export const getAudioOutputDevices = lazy((tracer?: Tracer) => {
  return merge(
    getDeviceChangeObserver(tracer),
    getAudioBrowserPermission().asObservable(),
  ).pipe(
    startWith(undefined),
    concatMap(() =>
      getDevices(getAudioBrowserPermission(), 'audiooutput', tracer),
    ),
    shareReplay(1),
  );
});

let getUserMediaExecId = 0;
const getStream = async (
  constraints: MediaStreamConstraints,
  tracer: Tracer | undefined,
) => {
  const tag = `navigator.mediaDevices.getUserMedia.${getUserMediaExecId++}.`;
  try {
    tracer?.trace(tag, constraints);
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    tracer?.trace(`${tag}OnSuccess`, dumpStream(stream));
    if (isFirefox()) {
      // When enumerating devices, Firefox will hide device labels unless there's been
      // an active user media stream on the page. So we force device list updates after
      // every successful getUserMedia call.
      navigator.mediaDevices.dispatchEvent(new Event('devicechange'));
    }
    if (constraints.video) {
      const [videoTrack] = stream.getVideoTracks();
      if (videoTrack) {
        const { width, height } = videoTrack.getSettings();
        const target = constraints.video as MediaTrackConstraints;
        if (width !== target.width || height !== target.height) {
          tracer?.trace(
            `${tag}Warn`,
            `Requested resolution ${target.width}x${target.height} but got ${width}x${height}`,
          );
        }
      }
    }

    return stream;
  } catch (error) {
    tracer?.trace(`${tag}OnFailure`, (error as Error).name);
    throw error;
  }
};

function isNotFoundOrOverconstrainedError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  if ('name' in error && typeof error.name === 'string') {
    const name = error.name;
    if (['OverconstrainedError', 'NotFoundError'].includes(name)) {
      return true;
    }
  }

  if ('message' in error && typeof error.message === 'string') {
    const message = error.message;
    if (message.startsWith('OverconstrainedError')) {
      return true;
    }
  }

  return false;
}

/**
 * Returns an audio media stream that fulfills the given constraints.
 * If no constraints are provided, it uses the browser's default ones.
 *
 * @param trackConstraints the constraints to use when requesting the stream.
 * @param tracer the tracer to use for tracing the stream creation.
 * @returns a new `MediaStream` fulfilling the given constraints.
 */
export const getAudioStream = async (
  trackConstraints?: MediaTrackConstraints,
  tracer?: Tracer,
): Promise<MediaStream> => {
  const constraints: MediaStreamConstraints = {
    audio: {
      ...audioDeviceConstraints.audio,
      ...trackConstraints,
    },
  };

  try {
    await getAudioBrowserPermission().prompt({
      throwOnNotAllowed: true,
      forcePrompt: true,
    });
    return await getStream(constraints, tracer);
  } catch (error) {
    if (isNotFoundOrOverconstrainedError(error) && trackConstraints?.deviceId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deviceId, ...relaxedConstraints } = trackConstraints;
      videoLoggerSystem
        .getLogger('devices')
        .warn(
          'Failed to get audio stream, will try again with relaxed constraints',
          { error, constraints, relaxedConstraints },
        );
      return getAudioStream(relaxedConstraints);
    }

    videoLoggerSystem.getLogger('devices').error('Failed to get audio stream', {
      error,
      constraints,
    });
    throw error;
  }
};

/**
 * Returns a video media stream that fulfills the given constraints.
 * If no constraints are provided, it uses the browser's default ones.
 *
 * @param trackConstraints the constraints to use when requesting the stream.
 * @param tracer the tracer to use for tracing the stream creation.
 * @returns a new `MediaStream` fulfilling the given constraints.
 */
export const getVideoStream = async (
  trackConstraints?: MediaTrackConstraints,
  tracer?: Tracer,
): Promise<MediaStream> => {
  const constraints: MediaStreamConstraints = {
    video: {
      ...videoDeviceConstraints.video,
      ...trackConstraints,
    },
  };
  try {
    await getVideoBrowserPermission().prompt({
      throwOnNotAllowed: true,
      forcePrompt: true,
    });
    return await getStream(constraints, tracer);
  } catch (error) {
    if (isNotFoundOrOverconstrainedError(error) && trackConstraints?.deviceId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deviceId, ...relaxedConstraints } = trackConstraints;
      videoLoggerSystem
        .getLogger('devices')
        .warn(
          'Failed to get video stream, will try again with relaxed constraints',
          { error, constraints, relaxedConstraints },
        );
      return getVideoStream(relaxedConstraints);
    }

    videoLoggerSystem.getLogger('devices').error('Failed to get video stream', {
      error,
      constraints,
    });
    throw error;
  }
};

let getDisplayMediaExecId = 0;

/**
 * Prompts the user for a permission to share a screen.
 * If the user grants the permission, a screen sharing stream is returned. Throws otherwise.
 *
 * The callers of this API are responsible to handle the possible errors.
 *
 * @param options any additional options to pass to the [`getDisplayMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) API.
 * @param tracer the tracer to use for tracing the stream creation.
 */
export const getScreenShareStream = async (
  options?: DisplayMediaStreamOptions,
  tracer?: Tracer | undefined,
) => {
  const tag = `navigator.mediaDevices.getDisplayMedia.${getDisplayMediaExecId++}.`;
  try {
    const constraints: DisplayMediaStreamOptions = {
      // @ts-expect-error - not present in types yet
      systemAudio: 'include',
      ...options,
      video:
        typeof options?.video === 'boolean'
          ? options.video // must be 'true'
          : {
              width: { max: 2560 },
              height: { max: 1440 },
              frameRate: { ideal: 30 },
              ...options?.video,
            },
      audio:
        typeof options?.audio === 'boolean'
          ? options.audio
          : {
              channelCount: { ideal: 2 },
              echoCancellation: false,
              autoGainControl: false,
              noiseSuppression: false,
              ...options?.audio,
            },
    };
    tracer?.trace(tag, constraints);
    const stream = await navigator.mediaDevices.getDisplayMedia(constraints);
    tracer?.trace(`${tag}OnSuccess`, dumpStream(stream));
    return stream;
  } catch (e) {
    tracer?.trace(`${tag}OnFailure`, (e as Error).name);
    videoLoggerSystem
      .getLogger('devices')
      .error('Failed to get screen share stream', e);
    throw e;
  }
};

export const deviceIds$ =
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices !== 'undefined'
    ? getDeviceChangeObserver().pipe(
        startWith(undefined),
        concatMap(() => navigator.mediaDevices.enumerateDevices()),
        shareReplay(1),
      )
    : undefined;

/**
 * Resolves `default` device id into the real device id. Some browsers (notably,
 * Chromium-based) report device with id `default` among audio input and output
 * devices. Since not every browser does that, we never want `default` id to be
 * used within our SDK. This function tries to find the real id for the `default`
 * device.
 */
export function resolveDeviceId(
  deviceId: string | undefined,
  kind: MediaDeviceKind,
): string | undefined {
  if (deviceId !== 'default') return deviceId;
  const devices = deviceIds$ && getCurrentValue(deviceIds$);
  if (!devices) return deviceId;
  const defaultDeviceInfo = devices.find((d) => d.deviceId === deviceId);
  if (!defaultDeviceInfo) return deviceId;
  const groupId = defaultDeviceInfo.groupId;
  const candidates = devices.filter(
    (d) => d.kind === kind && d.deviceId !== 'default' && d.groupId === groupId,
  );
  return candidates.length === 1 ? candidates[0].deviceId : deviceId;
}
