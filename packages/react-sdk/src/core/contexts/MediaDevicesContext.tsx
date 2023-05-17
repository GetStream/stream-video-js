import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { map } from 'rxjs';
import {
  CallingState,
  checkIfAudioOutputChangeSupported,
  disposeOfMediaStream,
  getAudioStream,
  getVideoStream,
  SfuModels,
  watchForDisconnectedAudioOutputDevice,
} from '@stream-io/video-client';
import {
  useCall,
  useCallCallingState,
  useCallState,
} from '@stream-io/video-react-bindings';

import {
  useAudioInputDeviceFallback,
  useAudioOutputDeviceFallback,
  useAudioPublisher,
  useVideoDeviceFallback,
  useVideoPublisher,
} from '../hooks';

type EnabledStateType = 'starting' | 'playing';
type DisabledStateType = 'uninitialized' | 'stopped';
type ErrorStateType = 'error';
type DeviceStateType = EnabledStateType | DisabledStateType | ErrorStateType;

type EnabledDeviceState<T extends EnabledStateType> = {
  type: T;
  enabled: true;
};
type DisabledDeviceState<T extends DisabledStateType> = {
  type: T;
  enabled: false;
};
type ErrorDeviceState = {
  type: 'error';
  message: string;
  enabled: false;
};

type DeviceState =
  | EnabledDeviceState<EnabledStateType>
  | DisabledDeviceState<DisabledStateType>
  | ErrorDeviceState;

const DEVICE_STATE_TOGGLE: Record<DeviceStateType, 'starting' | 'stopped'> = {
  starting: 'stopped',
  playing: 'stopped',
  stopped: 'starting',
  uninitialized: 'starting',
  error: 'starting',
};

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export const DEVICE_STATE: {
  starting: EnabledDeviceState<'starting'>;
  playing: EnabledDeviceState<'playing'>;
  stopped: DisabledDeviceState<'stopped'>;
  uninitialized: DisabledDeviceState<'uninitialized'>;
  error: ErrorDeviceState;
} = {
  starting: { type: 'starting', enabled: true },
  playing: { type: 'playing', enabled: true },
  stopped: { type: 'stopped', enabled: false },
  uninitialized: { type: 'uninitialized', enabled: false },
  error: { type: 'error', message: '', enabled: false },
};

const DEFAULT_DEVICE_ID = 'default';

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type MediaDevicesContextAPI = {
  disposeOfMediaStream: (stream: MediaStream) => void;
  getAudioStream: (deviceId?: string) => Promise<MediaStream>;
  getVideoStream: (deviceId?: string) => Promise<MediaStream>;
  isAudioOutputChangeSupported: boolean;
  initialAudioEnabled: boolean;
  initialVideoState: DeviceState;
  publishVideoStream: () => Promise<void>;
  publishAudioStream: () => Promise<void>;
  stopPublishingAudio: () => void;
  stopPublishingVideo: () => void;
  setInitialAudioEnabled: (enabled: boolean) => void;
  setInitialVideoState: (state: DeviceState) => void;
  selectedAudioInputDeviceId?: string;
  selectedAudioOutputDeviceId?: string;
  selectedVideoDeviceId?: string;
  switchDevice: (kind: MediaDeviceKind, deviceId?: string) => void;
  toggleInitialAudioMuteState: () => void;
  toggleInitialVideoMuteState: () => void;
};

const MediaDevicesContext = createContext<MediaDevicesContextAPI | null>(null);

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type MediaDevicesProviderProps = PropsWithChildren<{
  enumerate?: boolean;
  initialAudioEnabled?: boolean;
  initialVideoEnabled?: boolean;
  initialAudioInputDeviceId?: string;
  initialAudioOutputDeviceId?: string;
  initialVideoInputDeviceId?: string;
}>;

// todo: republish the stream, when a new default device connected
/**
 *
 * @param param0
 * @returns
 *
 * @category Device Management
 */
export const MediaDevicesProvider = ({
  children,
  initialAudioEnabled,
  initialVideoEnabled,
  initialVideoInputDeviceId = DEFAULT_DEVICE_ID,
  initialAudioOutputDeviceId = DEFAULT_DEVICE_ID,
  initialAudioInputDeviceId = DEFAULT_DEVICE_ID,
}: MediaDevicesProviderProps) => {
  const call = useCall();
  const callingState = useCallCallingState();
  const callState = useCallState();
  const { localParticipant$ } = callState;

  const [selectedAudioInputDeviceId, selectAudioInputDeviceId] = useState<
    MediaDevicesContextAPI['selectedAudioInputDeviceId']
  >(initialAudioInputDeviceId);
  const [selectedAudioOutputDeviceId, selectAudioOutputDeviceId] = useState<
    MediaDevicesContextAPI['selectedAudioOutputDeviceId']
  >(initialAudioOutputDeviceId);
  const [selectedVideoDeviceId, selectVideoDeviceId] = useState<
    MediaDevicesContextAPI['selectedVideoDeviceId']
  >(initialVideoInputDeviceId);

  const [isAudioOutputChangeSupported] = useState<boolean>(() =>
    checkIfAudioOutputChangeSupported(),
  );
  const [initAudioEnabled, setInitialAudioEnabled] = useState<boolean>(
    !!initialAudioEnabled,
  );
  const [initialVideoState, setInitialVideoState] = useState<DeviceState>(() =>
    initialVideoEnabled ? DEVICE_STATE.starting : DEVICE_STATE.uninitialized,
  );

  const publishVideoStream = useVideoPublisher({
    initialVideoMuted: !initialVideoState.enabled,
    videoDeviceId: selectedVideoDeviceId,
  });
  const publishAudioStream = useAudioPublisher({
    initialAudioMuted: !initAudioEnabled,
    audioDeviceId: selectedAudioInputDeviceId,
  });

  const stopPublishingAudio = useCallback(() => {
    if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.RINGING
    ) {
      setInitialAudioEnabled(false);
    } else {
      call?.stopPublish(SfuModels.TrackType.AUDIO);
    }
  }, [call, callingState]);

  const stopPublishingVideo = useCallback(() => {
    if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.RINGING
    ) {
      setInitialVideoState(DEVICE_STATE.stopped);
    } else {
      call?.stopPublish(SfuModels.TrackType.VIDEO);
    }
  }, [call, callingState]);

  const toggleInitialAudioMuteState = useCallback(
    () =>
      setInitialAudioEnabled((prev) => {
        return !prev;
      }),
    [],
  );
  const toggleInitialVideoMuteState = useCallback(
    () =>
      setInitialVideoState((prev) => {
        const newType = DEVICE_STATE_TOGGLE[prev.type];
        return DEVICE_STATE[newType];
      }),
    [],
  );

  const switchDevice = useCallback(
    (kind: MediaDeviceKind, deviceId?: string) => {
      if (kind === 'videoinput') {
        selectVideoDeviceId(deviceId);
      }
      if (kind === 'audioinput') {
        selectAudioInputDeviceId(deviceId);
      }
      if (kind === 'audiooutput') {
        selectAudioOutputDeviceId(deviceId);
      }
    },
    [],
  );

  useAudioInputDeviceFallback(
    () => switchDevice('audioinput', DEFAULT_DEVICE_ID),
    selectedAudioInputDeviceId,
  );
  useAudioOutputDeviceFallback(
    () => switchDevice('audiooutput', DEFAULT_DEVICE_ID),
    selectedAudioOutputDeviceId,
  );
  useVideoDeviceFallback(
    () => switchDevice('videoinput', DEFAULT_DEVICE_ID),
    selectedVideoDeviceId,
  );

  useEffect(() => {
    if (!call || callingState !== CallingState.JOINED) return;
    call.setAudioOutputDevice(selectedAudioOutputDeviceId);
  }, [call, callingState, selectedAudioOutputDeviceId]);

  useEffect(() => {
    if (!localParticipant$) return;
    const subscription = watchForDisconnectedAudioOutputDevice(
      localParticipant$.pipe(map((p) => p?.audioOutputDeviceId)),
    ).subscribe(async () => {
      selectAudioOutputDeviceId(DEFAULT_DEVICE_ID);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$]);

  const contextValue: MediaDevicesContextAPI = {
    disposeOfMediaStream,
    getAudioStream,
    getVideoStream,
    isAudioOutputChangeSupported,
    selectedAudioInputDeviceId,
    selectedAudioOutputDeviceId,
    selectedVideoDeviceId,
    switchDevice,
    initialAudioEnabled: initAudioEnabled,
    initialVideoState,
    setInitialAudioEnabled,
    setInitialVideoState,
    toggleInitialAudioMuteState,
    toggleInitialVideoMuteState,
    publishAudioStream,
    publishVideoStream,
    stopPublishingAudio,
    stopPublishingVideo,
  };

  return (
    <MediaDevicesContext.Provider value={contextValue}>
      {children}
    </MediaDevicesContext.Provider>
  );
};

/**
 *
 * @returns
 *
 * @category Device Management
 */
export const useMediaDevices = () => {
  const value = useContext(MediaDevicesContext);
  if (!value) {
    console.warn(`Null MediaDevicesContext`);
  }
  return value as MediaDevicesContextAPI;
};
