import {
  combineLatest,
  concatMap,
  debounceTime,
  filter,
  firstValueFrom,
  from,
  map,
  merge,
  Observable,
  shareReplay,
} from 'rxjs';

const getDevices = (constraints?: MediaStreamConstraints) => {
  return new Observable<MediaDeviceInfo[]>((subscriber) => {
    navigator.mediaDevices
      .getUserMedia(constraints)
      .then((media) => {
        // in Firefox, devices can be enumerated after userMedia is requested
        // and permissions granted. Otherwise, device labels are empty
        navigator.mediaDevices.enumerateDevices().then((devices) => {
          subscriber.next(devices);
          // If we stop the tracks before enumerateDevices -> the labels won't show up in Firefox
          media.getTracks().forEach((t) => t.stop());
          subscriber.complete();
        });
      })
      .catch((error) => {
        console.error('Failed to get devices', error);
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
  const isFeatureSupported = (element as any).sinkId !== undefined;

  return isFeatureSupported;
};

const audioDeviceConstraints: MediaStreamConstraints = {
  audio: { noiseSuppression: true },
};
const videoDeviceConstraints: MediaStreamConstraints = {
  video: { width: 960, height: 540 },
};

// Audio and video devices are requested in two separate requests: that way users will be presented with two separate prompts -> they can give access to just camera, or just microphone
const deviceChange$ = new Observable((subscriber) => {
  const deviceChangeHandler = () => subscriber.next();

  navigator.mediaDevices.addEventListener?.(
    'devicechange',
    deviceChangeHandler,
  );

  return () =>
    navigator.mediaDevices.removeEventListener?.(
      'devicechange',
      deviceChangeHandler,
    );
}).pipe(
  debounceTime(500),
  concatMap(() => from(navigator.mediaDevices.enumerateDevices())),
  shareReplay(1),
);

const audioDevices$ = merge(
  getDevices(audioDeviceConstraints),
  deviceChange$,
).pipe(shareReplay(1));

const videoDevices$ = merge(
  getDevices(videoDeviceConstraints),
  deviceChange$,
).pipe(shareReplay(1));

/**
 * Prompts the user for a permission to use audio devices (if not already granted) and lists the available 'audioinput' devices, if devices are added/removed the list is updated.
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @returns
 */
export const getAudioDevices = () =>
  audioDevices$.pipe(
    map((values) => values.filter((d) => d.kind === 'audioinput')),
  );

/**
 * Prompts the user for a permission to use video devices (if not already granted) and lists the available 'videoinput' devices, if devices are added/removed the list is updated.
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @returns
 */
export const getVideoDevices = () =>
  videoDevices$.pipe(
    map((values) =>
      values.filter((d) => d.kind === 'videoinput' && d.deviceId.length),
    ),
  );

/**
 * Prompts the user for a permission to use audio devices (if not already granted) and lists the available 'audiooutput' devices, if devices are added/removed the list is updated. Selecting 'audiooutput' device only makes sense if [the browser has support for changing audio output on 'audio' elements](#checkifaudiooutputchangesupported)
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @returns
 */
export const getAudioOutputDevices = () => {
  return audioDevices$.pipe(
    map((values) => values.filter((d) => d.kind === 'audiooutput')),
  );
};

const getStream = async (
  kind: Exclude<MediaDeviceKind, 'audiooutput'>,
  deviceId?: string,
) => {
  if (!deviceId) {
    const allDevices = await firstValueFrom(
      kind === 'audioinput' ? getAudioDevices() : getVideoDevices(),
    );
    if (allDevices.length === 0) {
      throw new Error(`No available ${kind} device found`);
    }
    // TODO: store last used device in local storage and use that value
    const selectedDevice = allDevices[0];
    deviceId = selectedDevice.deviceId;
  }
  const type = kind === 'audioinput' ? 'audio' : 'video';
  const defaultConstraints =
    type === 'audio' ? audioDeviceConstraints : videoDeviceConstraints;

  // merge the default constraints with the deviceId
  const constraints: MediaStreamConstraints = {
    [type]: {
      ...(defaultConstraints[type] as {}),
      deviceId,
    },
  };

  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (e) {
    console.error(`Failed to get ${type} stream for device ${deviceId}`, e);
    throw e;
  }
};

/**
 * Returns an 'audioinput' media stream with the given `deviceId`, if no `deviceId` is provided, it uses the first available device.
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param deviceId
 * @returns
 */
export const getAudioStream = async (deviceId?: string) => {
  return getStream('audioinput', deviceId);
};

/**
 * Returns a 'videoinput' media stream with the given `deviceId`, if no `deviceId` is provided, it uses the first available device.
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param deviceId
 * @returns
 */
export const getVideoStream = async (deviceId?: string) => {
  return getStream('videoinput', deviceId);
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
  // TODO OL: switch to `DisplayMediaStreamConstraints` once Angular supports it
  options?: Record<string, any>,
) => {
  try {
    return await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: false,
      ...options,
    });
  } catch (e) {
    console.error('Failed to get screen share stream', e);
    throw e;
  }
};

const watchForDisconnectedDevice = (
  kind: MediaDeviceKind,
  deviceId$: Observable<string | undefined>,
) => {
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
  }
  return combineLatest([devices$, deviceId$]).pipe(
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
 */
export const watchForDisconnectedAudioDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice('audioinput', deviceId$);
};

/**
 * Notifies the subscriber if a given 'videoinput' device is disconnected
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param deviceId$ an Observable that specifies which device to watch for
 * @returns
 */
export const watchForDisconnectedVideoDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice('videoinput', deviceId$);
};

/**
 * Notifies the subscriber if a given 'audiooutput' device is disconnected
 *
 * @angular It's recommended to use the [`DeviceManagerService`](./DeviceManagerService.md) for a higher level API, use this low-level method only if the `DeviceManagerService` doesn't suit your requirements.
 * @param deviceId$ an Observable that specifies which device to watch for
 * @returns
 */
export const watchForDisconnectedAudioOutputDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice('audiooutput', deviceId$);
};

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
};
