const createTrack = (
  settings: MediaTrackSettings,
  extras: Partial<MediaStreamTrack> = {},
) => {
  const eventHandlers = {} as Record<
    string,
    EventListenerOrEventListenerObject
  >;
  const track: Partial<MediaStreamTrack> = {
    getSettings: () => settings,
    enabled: true,
    readyState: 'live',
    stop: () => {
      // @ts-expect-error read-only property
      track.readyState = 'ended';
    },
    addEventListener: (
      event: string,
      handler: EventListenerOrEventListenerObject,
    ) => {
      eventHandlers[event] = handler;
    },
    removeEventListener(type: string) {
      delete eventHandlers[type];
    },
    ...extras,
  };

  return track as MediaStreamTrack;
};

export const createAudioStreamForDevice = (
  deviceId: string,
  label: string,
): MediaStream => {
  const track = createTrack({ deviceId }, { label });
  return {
    getTracks: () => [track],
    getAudioTracks: () => [track],
  } as unknown as MediaStream;
};

export const createVideoStreamForDevice = (
  deviceId: string,
  facingMode: 'user' | 'environment' = 'user',
): MediaStream => {
  const track = createTrack({
    deviceId,
    width: 1280,
    height: 720,
    facingMode,
  });

  return {
    getTracks: () => [track],
    getVideoTracks: () => [track],
  } as unknown as MediaStream;
};
