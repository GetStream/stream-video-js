import {
  concatMap,
  debounceTime,
  from,
  fromEvent,
  map,
  merge,
  shareReplay,
  startWith,
} from 'rxjs';
import { getLogger } from '../logger';
import { BrowserPermission } from './BrowserPermission';
import { lazy } from '../helpers/lazy';

/**
 * Returns an Observable that emits the list of available devices
 * that meet the given constraints.
 *
 * @param permission a BrowserPermission instance.
 * @param kind the kind of devices to enumerate.
 */
const getDevices = (permission: BrowserPermission, kind: MediaDeviceKind) => {
  return from(
    (async () => {
      let devices = await navigator.mediaDevices.enumerateDevices();
      // for privacy reasons, most browsers don't give you device labels
      // unless you have a corresponding camera or microphone permission
      const shouldPromptForBrowserPermission = devices.some(
        (device) => device.kind === kind && device.label === '',
      );
      if (shouldPromptForBrowserPermission) {
        await permission.prompt({ throwOnNotAllowed: true });
        devices = await navigator.mediaDevices.enumerateDevices();
      }
      return devices.filter((d) => d.kind === kind);
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

const getDeviceChangeObserver = lazy(() => {
  // 'addEventListener' is not available in React Native, returning
  // an observable that will never fire
  if (!navigator.mediaDevices.addEventListener) return from([]);
  return fromEvent(navigator.mediaDevices, 'devicechange').pipe(
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
export const getAudioDevices = lazy(() => {
  return merge(
    getDeviceChangeObserver(),
    getAudioBrowserPermission().asObservable(),
  ).pipe(
    startWith(undefined),
    concatMap(() => getDevices(getAudioBrowserPermission(), 'audioinput')),
    shareReplay(1),
  );
});

/**
 * Prompts the user for a permission to use video devices (if not already granted
 * and was not prompted before) and lists the available 'videoinput' devices,
 * if devices are added/removed the list is updated, and if the permission is revoked,
 * the observable errors.
 */
export const getVideoDevices = () => {
  return merge(
    getDeviceChangeObserver(),
    getVideoBrowserPermission().asObservable(),
  ).pipe(
    startWith(undefined),
    concatMap(() => getDevices(getVideoBrowserPermission(), 'videoinput')),
    shareReplay(1),
  );
};

/**
 * Prompts the user for a permission to use video devices (if not already granted
 * and was not prompted before) and lists the available 'audiooutput' devices,
 * if devices are added/removed the list is updated, and if the permission is revoked,
 * the observable errors.
 */
export const getAudioOutputDevices = () => {
  return merge(
    getDeviceChangeObserver(),
    getAudioBrowserPermission().asObservable(),
  ).pipe(
    startWith(undefined),
    concatMap(() => getDevices(getAudioBrowserPermission(), 'audiooutput')),
    shareReplay(1),
  );
};

const getStream = async (constraints: MediaStreamConstraints) => {
  return await navigator.mediaDevices.getUserMedia(constraints);
};

/**
 * Returns an audio media stream that fulfills the given constraints.
 * If no constraints are provided, it uses the browser's default ones.
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param trackConstraints the constraints to use when requesting the stream.
 * @returns the new `MediaStream` fulfilling the given constraints.
 */
export const getAudioStream = async (
  trackConstraints?: MediaTrackConstraints,
) => {
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
    return getStream(constraints);
  } catch (e) {
    getLogger(['devices'])('error', 'Failed to get audio stream', {
      error: e,
      constraints: constraints,
    });
    throw e;
  }
};

/**
 * Returns a video media stream that fulfills the given constraints.
 * If no constraints are provided, it uses the browser's default ones.
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param trackConstraints the constraints to use when requesting the stream.
 * @returns a new `MediaStream` fulfilling the given constraints.
 */
export const getVideoStream = async (
  trackConstraints?: MediaTrackConstraints,
) => {
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
    return getStream(constraints);
  } catch (e) {
    getLogger(['devices'])('error', 'Failed to get video stream', {
      error: e,
      constraints: constraints,
    });
    throw e;
  }
};

/**
 * Prompts the user for a permission to share a screen.
 * If the user grants the permission, a screen sharing stream is returned. Throws otherwise.
 *
 * The callers of this API are responsible to handle the possible errors.
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 *
 * @param options any additional options to pass to the [`getDisplayMedia`](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getDisplayMedia) API.
 */
export const getScreenShareStream = async (
  options?: DisplayMediaStreamOptions,
) => {
  try {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: {
        channelCount: {
          ideal: 2,
        },
        echoCancellation: false,
        autoGainControl: false,
        noiseSuppression: false,
      },
      // @ts-expect-error - not present in types yet
      systemAudio: 'include',
      ...options,
    });
  } catch (e) {
    getLogger(['devices'])('error', 'Failed to get screen share stream', e);
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
 * Deactivates MediaStream (stops and removes tracks) to be later garbage collected
 *
 * @param stream MediaStream
 * @returns void
 */
export const disposeOfMediaStream = (stream: MediaStream) => {
  if (!stream.active) return;
  stream.getTracks().forEach((track) => {
    track.stop();
    stream.removeTrack(track);
  });
  // @ts-expect-error release() is present in react-native-webrtc and must be called to dispose the stream
  if (typeof stream.release === 'function') {
    // @ts-expect-error
    stream.release();
  }
};
