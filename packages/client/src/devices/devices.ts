import {
  combineLatest,
  concatMap,
  debounceTime,
  filter,
  from,
  map,
  merge,
  Observable,
  pairwise,
  shareReplay,
} from 'rxjs';
import { getLogger } from '../logger';

/**
 * Returns an Observable that emits the list of available devices
 * that meet the given constraints.
 *
 * @param constraints the constraints to use when requesting the devices.
 * @param kind the kind of devices to enumerate.
 */
const getDevices = (
  constraints: MediaStreamConstraints,
  kind: MediaDeviceKind,
) => {
  return new Observable<MediaDeviceInfo[]>((subscriber) => {
    const enumerate = async () => {
      let devices = await navigator.mediaDevices.enumerateDevices();
      // some browsers report empty device labels (Firefox).
      // in that case, we need to request permissions (via getUserMedia)
      // to be able to get the device labels
      const needsGetUserMedia = devices.some(
        (device) => device.kind === kind && device.label === '',
      );
      if (needsGetUserMedia) {
        let mediaStream: MediaStream | undefined;
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
          devices = await navigator.mediaDevices.enumerateDevices();
        } finally {
          if (mediaStream) disposeOfMediaStream(mediaStream);
        }
      }
      return devices;
    };

    enumerate()
      .then((devices) => {
        // notify subscribers and complete
        subscriber.next(devices);
        subscriber.complete();
      })
      .catch((error) => {
        const logger = getLogger(['devices']);
        logger('error', 'Failed to enumerate devices', error);
        subscriber.error(error);
      });
  });
};

/**
 * [Tells if the browser supports audio output change on 'audio' elements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId).
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
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
 * Creates a memoized observable instance
 * that will be created only once and shared between all callers.
 *
 * @param create a function that creates an Observable.
 */
const memoizedObservable = <T>(create: () => Observable<T>) => {
  let memoized: Observable<T>;
  return () => {
    if (!memoized) memoized = create();
    return memoized;
  };
};

const getDeviceChangeObserver = memoizedObservable(() => {
  // Audio and video devices are requested in two separate requests.
  // That way, users will be presented with two separate prompts
  // -> they can give access to just camera, or just microphone
  return new Observable((subscriber) => {
    // 'addEventListener' is not available in React Native
    if (!navigator.mediaDevices.addEventListener) return;

    const notify = () => subscriber.next();
    navigator.mediaDevices.addEventListener('devicechange', notify);
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', notify);
    };
  }).pipe(
    debounceTime(500),
    concatMap(() => from(navigator.mediaDevices.enumerateDevices())),
    shareReplay(1),
  );
});

const getAudioDevicesObserver = memoizedObservable(() => {
  return merge(
    getDevices(audioDeviceConstraints, 'audioinput'),
    getDeviceChangeObserver(),
  ).pipe(shareReplay(1));
});

const getAudioOutputDevicesObserver = memoizedObservable(() => {
  return merge(
    getDevices(audioDeviceConstraints, 'audiooutput'),
    getDeviceChangeObserver(),
  ).pipe(shareReplay(1));
});

const getVideoDevicesObserver = memoizedObservable(() => {
  return merge(
    getDevices(videoDeviceConstraints, 'videoinput'),
    getDeviceChangeObserver(),
  ).pipe(shareReplay(1));
});

/**
 * Prompts the user for a permission to use audio devices (if not already granted) and lists the available 'audioinput' devices, if devices are added/removed the list is updated.
 */
export const getAudioDevices = () => {
  return getAudioDevicesObserver().pipe(
    map((values) => values.filter((d) => d.kind === 'audioinput')),
  );
};

/**
 * Prompts the user for a permission to use video devices (if not already granted) and lists the available 'videoinput' devices, if devices are added/removed the list is updated.
 */
export const getVideoDevices = () => {
  return getVideoDevicesObserver().pipe(
    map((values) => values.filter((d) => d.kind === 'videoinput')),
  );
};

/**
 * Prompts the user for a permission to use audio devices (if not already granted) and lists the available 'audiooutput' devices, if devices are added/removed the list is updated. Selecting 'audiooutput' device only makes sense if [the browser has support for changing audio output on 'audio' elements](#checkifaudiooutputchangesupported)
 */
export const getAudioOutputDevices = () => {
  return getAudioOutputDevicesObserver().pipe(
    map((values) => values.filter((d) => d.kind === 'audiooutput')),
  );
};

const getStream = async (constraints: MediaStreamConstraints) => {
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    getLogger(['devices'])('error', `Failed get user media`, {
      error: e,
      constraints: constraints,
    });
    throw e;
  }
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
  return getStream(constraints);
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
  return getStream(constraints);
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

const getDeviceIds = memoizedObservable(() =>
  merge(
    from(navigator.mediaDevices.enumerateDevices()),
    getDeviceChangeObserver(),
  ).pipe(shareReplay(1)),
);

export const watchForDisconnectedDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return combineLatest([getDeviceIds(), deviceId$]).pipe(
    filter(
      ([devices, deviceId]) =>
        !!deviceId && !devices.find((d) => d.deviceId === deviceId),
    ),
    map(() => true),
  );
};

/**
 * Notifies the subscriber if a given 'audioinput' device is disconnected
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param deviceId$ an Observable that specifies which device to watch for
 * @returns
 *
 * @deprecated use `watchForDisconnectedDevice`
 */
export const watchForDisconnectedAudioDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice(deviceId$);
};

/**
 * Notifies the subscriber if a given 'videoinput' device is disconnected
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param deviceId$ an Observable that specifies which device to watch for
 * @returns
 *
 * @deprecated use `watchForDisconnectedDevice`
 */
export const watchForDisconnectedVideoDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice(deviceId$);
};

/**
 * Notifies the subscriber if a given 'audiooutput' device is disconnected
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param deviceId$ an Observable that specifies which device to watch for
 * @returns
 *
 * @deprecated use `watchForDisconnectedDevice`
 */
export const watchForDisconnectedAudioOutputDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice(deviceId$);
};

const watchForAddedDefaultDevice = (kind: MediaDeviceKind) => {
  let devices$;
  switch (kind) {
    case 'audioinput':
      devices$ = getAudioDevices();
      break;
    case 'videoinput':
      devices$ = getVideoDevices();
      break;
    case 'audiooutput':
      devices$ = getAudioOutputDevices();
      break;
    default:
      throw new Error('Unknown MediaDeviceKind', kind);
  }

  return devices$.pipe(
    pairwise(),
    filter(([prev, current]) => {
      const prevDefault = prev.find((device) => device.deviceId === 'default');
      const currentDefault = current.find(
        (device) => device.deviceId === 'default',
      );
      return !!(
        current.length > prev.length &&
        prevDefault &&
        currentDefault &&
        prevDefault.groupId !== currentDefault.groupId
      );
    }),
    map(() => true),
  );
};

/**
 * Notifies the subscriber about newly added default audio input device.
 * @returns Observable<boolean>
 */
export const watchForAddedDefaultAudioDevice = () =>
  watchForAddedDefaultDevice('audioinput');

/**
 * Notifies the subscriber about newly added default audio output device.
 * @returns Observable<boolean>
 */
export const watchForAddedDefaultAudioOutputDevice = () =>
  watchForAddedDefaultDevice('audiooutput');

/**
 * Notifies the subscriber about newly added default video input device.
 * @returns Observable<boolean>
 */
export const watchForAddedDefaultVideoDevice = () =>
  watchForAddedDefaultDevice('videoinput');

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
