import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  checkIfAudioOutputChangeSupported,
  disposeOfMediaStream,
  getAudioDevices,
  getAudioOutputDevices,
  getAudioStream,
  getVideoDevices,
  getVideoStream,
  SfuModels,
  watchForDisconnectedAudioOutputDevice,
} from '@stream-io/video-client';
import { map, pairwise, take } from 'rxjs';
import { useAudioPublisher, useVideoPublisher } from '../hooks';
import { useActiveCall } from '@stream-io/video-react-bindings';

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

/**
 * Exclude types from documentaiton site, but we should still add doc comments
 * @internal
 */
export type MediaDevicesContextAPI = {
  audioInputDevices: MediaDeviceInfo[];
  audioOutputDevices: MediaDeviceInfo[];
  videoDevices: MediaDeviceInfo[];
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
  setInitialVideoState: (state: DeviceState) => void;
  selectedAudioInputDeviceId?: string;
  selectedAudioOutputDeviceId?: string;
  selectedVideoDeviceId?: string;
  switchDevice: (kind: MediaDeviceKind, deviceId?: string) => void;
  toggleAudioMuteState: () => void;
  toggleVideoMuteState: () => void;
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
  enumerate = true,
  initialAudioEnabled,
  initialVideoEnabled,
  initialVideoInputDeviceId = 'default',
  initialAudioOutputDeviceId = 'default',
  initialAudioInputDeviceId = 'default',
}: MediaDevicesProviderProps) => {
  const call = useActiveCall();
  const { localParticipant$ } = call?.state || {};

  const [audioInputDevices, setAudioInputDevices] = useState<MediaDeviceInfo[]>(
    [],
  );
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState<
    MediaDeviceInfo[]
  >([]);

  const [selectedAudioInputDeviceId, setSelectedAudioInputDeviceId] = useState<
    MediaDevicesContextAPI['selectedAudioInputDeviceId']
  >(initialAudioInputDeviceId);
  const [selectedAudioOutputDeviceId, setSelectedAudioOutputDeviceId] =
    useState<MediaDevicesContextAPI['selectedAudioOutputDeviceId']>(
      initialAudioOutputDeviceId,
    );
  const [selectedVideoDeviceId, selectVideoDeviceId] = useState<
    MediaDevicesContextAPI['selectedVideoDeviceId']
  >(initialVideoInputDeviceId);

  const [isAudioOutputChangeSupported] = useState<boolean>(() =>
    checkIfAudioOutputChangeSupported(),
  );
  const [initAudioEnabled, setInitAudioEnabled] = useState<boolean>(
    !!initialAudioEnabled,
  );
  const [initialVideoState, setInitialVideoState] = useState<DeviceState>(() =>
    initialVideoEnabled ? DEVICE_STATE.starting : DEVICE_STATE.uninitialized,
  );

  const publishVideoStream = useVideoPublisher({
    call,
    initialVideoMuted: !initialVideoState.enabled,
    videoDeviceId: selectedVideoDeviceId,
  });
  const publishAudioStream = useAudioPublisher({
    call,
    initialAudioMuted: !initAudioEnabled,
    audioDeviceId: selectedAudioInputDeviceId,
  });

  const stopPublishingAudio = useCallback(() => {
    setInitAudioEnabled(false);
    call?.stopPublish(SfuModels.TrackType.AUDIO);
  }, [call]);

  const stopPublishingVideo = useCallback(() => {
    setInitialVideoState(DEVICE_STATE.stopped);
    call?.stopPublish(SfuModels.TrackType.VIDEO);
  }, [call]);

  const toggleAudioMuteState = useCallback(
    () => setInitAudioEnabled((prev) => !prev),
    [],
  );
  const toggleVideoMuteState = useCallback(
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
        setSelectedAudioInputDeviceId(deviceId);
      }
      if (kind === 'audiooutput') {
        setSelectedAudioOutputDeviceId(deviceId);
      }
    },
    [],
  );

  useEffect(() => {
    if (!enumerate) return;

    const validateInitialInputDeviceId = getAudioDevices()
      .pipe(take(1))
      .subscribe((devices) => {
        const initialDeviceFound = devices.find(
          (device) => device.deviceId === initialAudioInputDeviceId,
        );
        if (!initialDeviceFound) {
          setSelectedAudioInputDeviceId('default');
        }
      });

    const subscription = getAudioDevices().subscribe(setAudioInputDevices);

    return () => {
      subscription.unsubscribe();
      validateInitialInputDeviceId.unsubscribe();
    };
  }, [enumerate, initialAudioInputDeviceId]);

  useEffect(() => {
    if (!enumerate) return;

    const validateInitialInputDeviceId = getVideoDevices()
      .pipe(take(1))
      .subscribe((devices) => {
        const initialDeviceFound = devices.find(
          (device) => device.deviceId === initialVideoInputDeviceId,
        );
        if (!initialDeviceFound) {
          selectVideoDeviceId('default');
        }
      });

    const subscription = getVideoDevices().subscribe(setVideoDevices);

    return () => {
      subscription.unsubscribe();
      validateInitialInputDeviceId.unsubscribe();
    };
  }, [enumerate, initialVideoInputDeviceId]);

  useEffect(() => {
    if (!enumerate) return;

    const validateInitialInputDeviceId = getAudioOutputDevices()
      .pipe(take(1))
      .subscribe((devices) => {
        const initialDeviceFound = devices.find(
          (device) => device.deviceId === initialAudioOutputDeviceId,
        );
        if (!initialDeviceFound) {
          setSelectedAudioOutputDeviceId('default');
        }
      });

    const subscription = getAudioOutputDevices().subscribe(
      setAudioOutputDevices,
    );
    return () => {
      subscription.unsubscribe();
      validateInitialInputDeviceId.unsubscribe();
    };
  }, [enumerate, initialAudioOutputDeviceId]);

  useEffect(() => {
    const subscription = getVideoDevices()
      .pipe(pairwise())
      .subscribe(([prev, current]) => {
        // When there are 0 video devices (e.g. when laptop lid closed),
        // we do not restart the video automatically when the device is again available,
        // but rather leave this to the user.
        if (prev.length > 0 && current.length === 0) {
          setInitialVideoState(DEVICE_STATE.stopped);
        }
      });

    return () => subscription.unsubscribe();
  }, [videoDevices.length]);

  useEffect(() => {
    if (!call) return;
    call.setAudioOutputDevice(selectedAudioOutputDeviceId);
  }, [call, selectedAudioOutputDeviceId]);

  useEffect(() => {
    if (!localParticipant$) return;
    const subscription = watchForDisconnectedAudioOutputDevice(
      localParticipant$.pipe(map((p) => p?.audioOutputDeviceId)),
    ).subscribe(async () => {
      setSelectedAudioOutputDeviceId('default');
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [localParticipant$]);

  const contextValue: MediaDevicesContextAPI = {
    audioInputDevices,
    videoDevices,
    audioOutputDevices,
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
    setInitialVideoState,
    toggleAudioMuteState,
    toggleVideoMuteState,
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
