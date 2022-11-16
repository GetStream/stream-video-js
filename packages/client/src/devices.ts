import {
  combineLatest,
  filter,
  firstValueFrom,
  map,
  Observable,
  shareReplay,
} from 'rxjs';

export const getDevices = (constraints: MediaStreamConstraints | undefined) => {
  return new Observable<MediaDeviceInfo[]>((subscriber) => {
    navigator.mediaDevices.getUserMedia(constraints).then(() => {
      // in Firefox, devices can be enumerated after userMedia is requested
      // and permissions granted. Otherwise, device labels are empty
      navigator.mediaDevices.enumerateDevices().then((devices) => {
        subscriber.next(devices);
      });
    });

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

const mediaDeviceConstraints = {
  audio: {},
  video: { width: 960, height: 540 },
};
const devices$ = getDevices(mediaDeviceConstraints).pipe(shareReplay(1));

export const getAudioDevices = () => {
  return devices$.pipe(
    map((values) => values.filter((d) => d.kind === 'audioinput')),
  );
};

export const getVideoDevices = () => {
  return devices$.pipe(
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

export const getAudioStream = async (deviceId?: string) => {
  return getStream('audioinput', deviceId);
};

export const getVideoStream = async (deviceId?: string) => {
  return getStream('videoinput', deviceId);
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

export const watchForDisconnectedAudioDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice('audioinput', deviceId$);
};

export const watchForDisconnectedVideoDevice = (
  deviceId$: Observable<string | undefined>,
) => {
  return watchForDisconnectedDevice('videoinput', deviceId$);
};
