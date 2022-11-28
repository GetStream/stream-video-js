import {
  combineLatest,
  filter,
  firstValueFrom,
  map,
  Observable,
  shareReplay,
} from 'rxjs';

const getDevices = (constraints: MediaStreamConstraints | undefined) => {
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
        });
      })
      .catch((error) => subscriber.error(error));

    const deviceChangeHandler = async () => {
      const allDevices = await navigator.mediaDevices.enumerateDevices();

      subscriber.next(allDevices);
    };

    navigator.mediaDevices.addEventListener(
      'devicechange',
      deviceChangeHandler,
    );

    return () =>
      navigator.mediaDevices.removeEventListener(
        'devicechange',
        deviceChangeHandler,
      );
  });
};

const audioDeviceConstraints = {
  audio: true,
};
const videoDeviceConstraints = {
  video: { width: 960, height: 540 },
};

// Audio and video devices are requested in two separate requests: that way users will be presented with two separate prompts -> they can give access to just camera, or just microphone
const audioDevices$ = getDevices(audioDeviceConstraints).pipe(shareReplay(1));
const videoDevices$ = getDevices(videoDeviceConstraints).pipe(shareReplay(1));

/**
 * Lists the list of available 'audioinput' devices, if devices are added/removed - the list is updated
 * @returns
 */
export const getAudioDevices = () => {
  return audioDevices$.pipe(
    map((values) => values.filter((d) => d.kind === 'audioinput')),
  );
};

/**
 * Lists the list of available 'videoinput' devices, if devices are added/removed - the list is updated
 * @returns
 */
export const getVideoDevices = () => {
  return videoDevices$.pipe(
    map((values) => values.filter((d) => d.kind === 'videoinput')),
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
  return navigator.mediaDevices.getUserMedia({
    [kind === 'audioinput' ? 'audio' : 'video']: { deviceId },
  });
};

/**
 * Returns an 'audioinput' media stream with the given deviceId, if no deviceId is provided, we use the first available device
 * @param deviceId
 * @returns
 */
export const getAudioStream = async (deviceId?: string) => {
  return getStream('audioinput', deviceId);
};

/**
 * Returns a 'videoinput' media stream with the given deviceId, if no deviceId is provided, we use the first available device
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
 * @param options any additional options to pass to the `getDisplayMedia` API.
 */
export const getScreenShareStream = async (
  options?: DisplayMediaStreamOptions,
) => {
  return navigator.mediaDevices.getDisplayMedia(options);
};

const watchForDisconnectedDevice = (
  kind: Exclude<MediaDeviceKind, 'audiooutput'>,
  deviceId$: Observable<string | undefined>,
) => {
  const devices$ =
    kind === 'audioinput' ? getAudioDevices() : getVideoDevices();
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
 * @param deviceId$ an Observable that specifies which device to watch for
 * @returns
 */
export const watchForDisconnectedVideoDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice('videoinput', deviceId$);
};
