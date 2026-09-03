import { StateStore } from '@stream-io/state-store';
import { BrowserPermission } from './BrowserPermission';
import { isSameDeviceList } from './devicePersistence';
import { lazy } from '../helpers/lazy';
import { isFirefox } from '../helpers/browsers';
import { dumpStream, Tracer } from '../stats';
import { createSubscribable, type Subscribable } from '../store/subscribable';
import { withoutConcurrency } from '../helpers/concurrency';
import { videoLoggerSystem } from '../logger';

/**
 * Every device the browser currently reports, of every kind.
 *
 * There is only one device list, so there is only one store. Each caller reads
 * the slice it cares about; a `devicechange` re-enumerates once rather than
 * once per interested party.
 */
const deviceStore = new StateStore<{ devices: MediaDeviceInfo[] }>({
  devices: [],
});

const enumerationTag = Symbol('device-enumeration');
const logEnumerationFailure = (err: unknown) =>
  videoLoggerSystem
    .getLogger('devices')
    .warn('Failed to enumerate media devices', err);

/**
 * Whether this environment can enumerate media devices at all.
 *
 * Checked on call rather than once at module evaluation: the client is
 * routinely imported during SSR, where `navigator` does not exist, and a value
 * captured then would stay wrong for the lifetime of the page.
 */
export const canEnumerateDevices = () =>
  typeof navigator !== 'undefined' &&
  typeof navigator.mediaDevices !== 'undefined';

/**
 * Re-reads the device list into the store. Calls are serialised, so a burst of
 * `devicechange` events cannot interleave enumerations.
 */
const refreshDevices = (tracer: Tracer | undefined) =>
  withoutConcurrency(enumerationTag, async () => {
    const devices = await navigator.mediaDevices.enumerateDevices();
    tracer?.traceOnce(
      'device-enumeration',
      'navigator.mediaDevices.enumerateDevices',
      devices,
    );
    deviceStore.partialNext({ devices });
    return devices;
  });

let watchingDeviceChanges = false;

/**
 * The tracer device enumeration is currently reported to.
 *
 * There is one process-wide `devicechange` listener but a tracer per call, so
 * the listener reads this at fire time rather than closing over whichever
 * tracer happened to install it. Without that, the first caller's tracer wins
 * forever: later calls' enumerations go unreported, and the listener keeps a
 * finished call's tracer (and everything it retains) alive for the lifetime of
 * the page.
 */
let deviceTracer: Tracer | undefined;

/**
 * Stops reporting device enumeration to `tracer`, if it is the current one.
 * Call this when the tracer's owner goes away.
 */
export const releaseDeviceTracer = (tracer: Tracer | undefined) => {
  if (tracer && deviceTracer === tracer) deviceTracer = undefined;
};

/**
 * Keeps the store current as devices come and go. Enumerating is left to the
 * caller, so that a caller which is about to enumerate anyway (to decide
 * whether it must prompt for permission) does not trigger a second, wasted
 * round trip.
 *
 * The `devicechange` handler is debounced: plugging in a headset fires several
 * events, and each enumeration is a round trip to the browser.
 */
const watchDeviceChanges = (tracer: Tracer | undefined) => {
  // the latest caller to bring a tracer owns the reporting
  if (tracer) deviceTracer = tracer;
  if (watchingDeviceChanges || !canEnumerateDevices()) return;
  watchingDeviceChanges = true;

  // not available in React Native, where the device list never changes
  if (!navigator.mediaDevices.addEventListener) return;
  let debounce: ReturnType<typeof setTimeout> | undefined;
  navigator.mediaDevices.addEventListener('devicechange', () => {
    deviceTracer?.resetTrace('device-enumeration');
    clearTimeout(debounce);
    debounce = setTimeout(() => {
      refreshDevices(deviceTracer).catch(logEnumerationFailure);
    }, 500);
  });
};

const devicesOfKind = (devices: MediaDeviceInfo[], kind: MediaDeviceKind) =>
  devices.filter(
    (device) =>
      device.kind === kind &&
      // browsers withhold labels until the matching permission is granted
      device.label !== '' &&
      device.deviceId !== 'default',
  );

/**
 * A `devicesOfKind` that returns the same array while the device list has not
 * changed.
 *
 * `Subscribable.getValue()` backs React's `useSyncExternalStore` snapshot,
 * which is compared by identity - returning a freshly filtered array on every
 * read sends the consuming component into an endless re-render loop.
 */
const memoizedDevicesOfKind = (kind: MediaDeviceKind) => {
  let cache:
    { input: MediaDeviceInfo[]; output: MediaDeviceInfo[] } | undefined;
  return (): MediaDeviceInfo[] => {
    const input = deviceStore.getLatestValue().devices;
    if (cache && cache.input === input) return cache.output;
    const output = devicesOfKind(input, kind);
    // a re-enumeration usually reports the very same devices; keep the
    // previous array so consumers do not see a change that did not happen
    const stable = cache && isSameDeviceList(cache.output, output);
    cache = { input, output: stable ? cache!.output : output };
    return cache.output;
  };
};

/**
 * Enumerates, and prompts for permission if that is what it takes to see the
 * labels of this kind of device. Resolves with the devices of that kind.
 */
const loadDevicesOfKind = async (
  kind: MediaDeviceKind,
  permission: BrowserPermission,
  tracer: Tracer | undefined,
): Promise<MediaDeviceInfo[]> => {
  if (!canEnumerateDevices()) return [];
  watchDeviceChanges(tracer);

  let devices = await refreshDevices(tracer);
  const labelsHidden = devices.some(
    (device) => device.kind === kind && device.label === '',
  );
  // `prompt()` only ever prompts once per permission
  if (labelsHidden && (await permission.prompt())) {
    devices = await refreshDevices(tracer);
  }
  return devicesOfKind(devices, kind);
};

/**
 * A live list of the devices of one kind.
 *
 * Subscribing starts enumeration, prompts for the permission needed to read
 * labels, and re-enumerates whenever that permission changes.
 */
const listDevicesOfKind = (
  kind: MediaDeviceKind,
  permission: BrowserPermission,
  tracer: Tracer | undefined,
): Subscribable<MediaDeviceInfo[]> => {
  const read = memoizedDevicesOfKind(kind);
  return createSubscribable(read, (emit) => {
    loadDevicesOfKind(kind, permission, tracer).catch(logEnumerationFailure);

    // `read` holds the array identity stable while the list is unchanged, so
    // an identity check is all the deduplication this needs
    let previous = read();
    const unsubscribeStore = deviceStore.subscribe(() => {
      const next = read();
      if (previous === next) return;
      previous = next;
      emit(next);
    });

    // a permission grant reveals labels, which is a device-list change that
    // the browser does not always report
    let isReplay = true;
    const unsubscribePermission = permission.state$.subscribe(() => {
      if (isReplay) {
        isReplay = false;
        return;
      }
      refreshDevices(tracer).catch(logEnumerationFailure);
    });

    return () => {
      unsubscribeStore();
      unsubscribePermission();
    };
  });
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
  (tracer: Tracer | undefined) =>
    new BrowserPermission({
      constraints: audioDeviceConstraints,
      queryName: 'microphone' as PermissionName,
      tracer,
    }),
);

/**
 * Keeps track of the browser permission to use camera. This permission also
 * affects an ability to enumerate video devices.
 */
export const getVideoBrowserPermission = lazy(
  (tracer: Tracer | undefined) =>
    new BrowserPermission({
      constraints: videoDeviceConstraints,
      queryName: 'camera' as PermissionName,
      tracer,
    }),
);

/**
 * Lists the available 'audioinput' devices, keeping the list current as devices
 * are added or removed.
 */
export const getAudioDevices = lazy((tracer?: Tracer) =>
  listDevicesOfKind('audioinput', getAudioBrowserPermission(tracer), tracer),
);

/**
 * Loads the available 'audioinput' devices, prompting for permission first if
 * that is needed to read their labels.
 */
export const loadAudioDevices = (tracer?: Tracer) =>
  loadDevicesOfKind('audioinput', getAudioBrowserPermission(tracer), tracer);

/**
 * Lists the available 'videoinput' devices, keeping the list current as devices
 * are added or removed.
 */
export const getVideoDevices = lazy((tracer?: Tracer) =>
  listDevicesOfKind('videoinput', getVideoBrowserPermission(tracer), tracer),
);

/**
 * Loads the available 'videoinput' devices, prompting for permission first if
 * that is needed to read their labels.
 */
export const loadVideoDevices = (tracer?: Tracer) =>
  loadDevicesOfKind('videoinput', getVideoBrowserPermission(tracer), tracer);

/**
 * Lists the available 'audiooutput' devices, keeping the list current as
 * devices are added or removed.
 */
export const getAudioOutputDevices = lazy((tracer?: Tracer) =>
  listDevicesOfKind('audiooutput', getAudioBrowserPermission(tracer), tracer),
);

/**
 * Loads the available 'audiooutput' devices, prompting for permission first if
 * that is needed to read their labels.
 */
export const loadAudioOutputDevices = (tracer?: Tracer) =>
  loadDevicesOfKind('audiooutput', getAudioBrowserPermission(tracer), tracer);

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
    await getAudioBrowserPermission(tracer).prompt({
      throwOnNotAllowed: true,
      forcePrompt: true,
    });
    return await getStream(constraints, tracer);
  } catch (error) {
    const logger = videoLoggerSystem.getLogger('devices');
    if (isNotFoundOrOverconstrainedError(error) && trackConstraints?.deviceId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deviceId, ...relaxedConstraints } = trackConstraints;
      logger.warn(
        'Failed to get audio stream, will try again with relaxed constraints',
        { error, constraints, relaxedConstraints },
      );
      return getAudioStream(relaxedConstraints, tracer);
    }

    logger.error('Failed to get audio stream', { error, constraints });
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
    await getVideoBrowserPermission(tracer).prompt({
      throwOnNotAllowed: true,
      forcePrompt: true,
    });
    return await getStream(constraints, tracer);
  } catch (error) {
    const logger = videoLoggerSystem.getLogger('devices');
    if (isNotFoundOrOverconstrainedError(error) && trackConstraints?.deviceId) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { deviceId, ...relaxedConstraints } = trackConstraints;
      logger.warn(
        'Failed to get video stream, will try again with relaxed constraints',
        { error, constraints, relaxedConstraints },
      );
      return getVideoStream(relaxedConstraints, tracer);
    }

    logger.error('Failed to get video stream', { error, constraints });
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
              // @ts-expect-error not yet present in the types
              restrictOwnAudio: true,
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

/**
 * Every device known to the browser, regardless of kind.
 *
 * Reports an empty list until the first enumeration resolves; await
 * {@link loadDeviceIds} when you need the real list.
 */
export const deviceIds$: Subscribable<MediaDeviceInfo[]> = createSubscribable(
  () => deviceStore.getLatestValue().devices,
  (emit) => {
    // checked here, not when this module is evaluated: during SSR there is no
    // `navigator`, and deciding then would leave this permanently inert in the
    // browser that later hydrates
    if (!canEnumerateDevices()) return () => {};
    watchDeviceChanges(undefined);
    refreshDevices(undefined).catch(logEnumerationFailure);
    let previous = deviceStore.getLatestValue().devices;
    return deviceStore.subscribe(({ devices }) => {
      if (devices === previous) return;
      previous = devices;
      emit(devices);
    });
  },
);

/**
 * Enumerates every device known to the browser, waiting for the enumeration to
 * complete.
 */
export const loadDeviceIds = async (): Promise<MediaDeviceInfo[]> => {
  if (!canEnumerateDevices()) return [];
  watchDeviceChanges(undefined);
  return refreshDevices(undefined);
};

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
  // reads the cache as it stands; callers that need it populated subscribe to
  // `deviceIds$` (which the device managers do) before resolving ids
  const { devices } = deviceStore.getLatestValue();
  if (!devices.length) return deviceId;
  const defaultDeviceInfo = devices.find((d) => d.deviceId === deviceId);
  if (!defaultDeviceInfo) return deviceId;
  const groupId = defaultDeviceInfo.groupId;
  const candidates = devices.filter(
    (d) => d.kind === kind && d.deviceId !== 'default' && d.groupId === groupId,
  );
  return candidates.length === 1 ? candidates[0].deviceId : deviceId;
}
