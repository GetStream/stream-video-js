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
import { useCall, useCallStateHooks } from '@stream-io/video-react-bindings';

import {
  useAudioInputDeviceFallback,
  useAudioOutputDeviceFallback,
  useAudioPublisher,
  useHasBrowserPermissions,
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
 * Exclude types from documentation site, but we should still add doc comments
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
 * API to control device enablement, device selection and media stream access for a call.
 * @category Device Management
 */
export type MediaDevicesContextAPI = {
  /**
   * Deactivates MediaStream (stops and removes tracks) to be later garbage collected
   *
   * @param stream MediaStream
   * @returns void
   */
  disposeOfMediaStream: (stream: MediaStream) => void;
  /**
   * Returns an 'audioinput' media stream with the given `deviceId`, if no `deviceId` is provided, it uses the first available device.
   *
   * @param deviceId
   * @returns
   */
  getAudioStream: typeof getAudioStream;
  /**
   * Returns a 'videoinput' media stream with the given `deviceId`, if no `deviceId` is provided, it uses the first available device.
   *
   * @param deviceId
   * @returns
   */
  getVideoStream: typeof getVideoStream;
  /**
   * [Tells if the browser supports audio output change on 'audio' elements](https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/setSinkId).
   */
  isAudioOutputChangeSupported: boolean;
  /**
   * Signals whether audio stream will be published when the call is joined.
   */
  initialAudioEnabled: boolean;
  /**
   * Signals whether audio stream will be published when the call is joined.
   */
  initialVideoState: DeviceState;
  /**
   * Publishes audio stream for currently selected audio input (microphone) device to other call participants.
   */
  publishAudioStream: () => Promise<void>;
  /**
   * Publishes video stream for currently selected video input (camera) device to other call participants.
   */
  publishVideoStream: () => Promise<void>;
  /**
   * Stops publishing audio stream for currently selected audio input (microphone) device to other call participants.
   */
  stopPublishingAudio: () => Promise<void>;
  /**
   * Stops publishing video stream for currently selected video input (camera) device to other call participants.
   */
  stopPublishingVideo: () => Promise<void>;
  /**
   * Sets the initialAudioEnabled flag to a given boolean value.
   * The latest value set will be used to decide, whether audio stream will be published when joining a call.
   * @param enabled
   */
  setInitialAudioEnabled: (enabled: boolean) => void;

  /**
   * Sets the initialVideoState to a given DeviceState value.
   * The latest value set will be used to decide, whether video stream will be published when joining a call.
   * @param enabled
   */
  setInitialVideoState: (state: DeviceState) => void;
  /**
   * Stores audio input device (microphone) id which is used to publish user's sound to other call participants.
   */
  selectedAudioInputDeviceId?: string;
  /**
   * Stores audio output device (speaker) id used to reproduce incoming audio from other call participants.
   */
  selectedAudioOutputDeviceId?: string;
  /**
   * Stores video input device (camera) id which is used to publish user's video to other call participants.
   */
  selectedVideoDeviceId?: string;
  /**
   * Function should be used to change selected device id.
   * The change is later reflected in selectedAudioInputDeviceId, selectedAudioOutputDeviceId or selectedVideoDeviceId depending on kind parameter.
   * @param kind
   * @param deviceId
   */
  switchDevice: (kind: MediaDeviceKind, deviceId?: string) => void;
  /**
   * Sets the initialAudioEnabled flag by negating the current state value.
   * The latest value set will be used to decide, whether audio stream will be published when joining a call.
   * @param enabled
   */
  toggleInitialAudioMuteState: () => void;
  /**
   * Sets the initialVideoState by toggling  the current state DeviceState value.
   * The latest value set will be used to decide, whether video stream will be published when joining a call.
   * @param enabled
   */
  toggleInitialVideoMuteState: () => void;
};

const MediaDevicesContext = createContext<MediaDevicesContextAPI | null>(null);

/**
 * Configuration parameters for MediaDevicesProvider.
 * @category Device Management
 */
export type MediaDevicesProviderProps = {
  /**
   * Provides external control over the initial audio input (microphone) enablement. Overrides the default false.
   */
  initialAudioEnabled?: boolean;
  /**
   * Provides external control over the initial video input (camera) enablement. Overrides the default false.
   */
  initialVideoEnabled?: boolean;
  /**
   * Allows to override the default audio input (microphone) stream to be published. Overrides the default string 'default'.
   */
  initialAudioInputDeviceId?: string;
  /**
   * Allows to override the default audio output (speaker) device to reproduce incoming audio from the SFU. Overrides the default string 'default'.
   */
  initialAudioOutputDeviceId?: string;
  /**
   * Allows to override the default video input (camera) stream to be published. Overrides the default string 'default'.
   */
  initialVideoInputDeviceId?: string;
};

/**
 * Context provider that internally puts in place mechanisms that:
 * 1. fall back to selecting a default device when trying to switch to a non-existent device
 * 2. fall back to a default device when an active device is disconnected
 * 3. stop publishing a media stream when a non-default device is disconnected
 * 4. republish a media stream from the newly connected default device
 * 5. republish a media stream when a new device is selected
 *
 * Provides `MediaDevicesContextAPI` that allow the integrators to handle:
 * 1. the initial device state enablement (for example apt for lobby scenario)
 * 2. media stream retrieval and disposal
 * 3. media stream publishing
 * 4. specific device selection
 * @param params
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
}: PropsWithChildren<MediaDevicesProviderProps>) => {
  const call = useCall();
  const { useCallCallingState, useCallState, useCallMetadata } =
    useCallStateHooks();
  const callingState = useCallCallingState();
  const callState = useCallState();
  const metadata = useCallMetadata();
  const { localParticipant$ } = callState;
  const hasBrowserPermissionVideoInput = useHasBrowserPermissions(
    'camera' as PermissionName,
  );
  const hasBrowserPermissionAudioInput = useHasBrowserPermissions(
    'microphone' as PermissionName,
  );
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

  const settings = metadata?.settings;
  useEffect(() => {
    if (!settings) return;
    const { audio, video } = settings;
    if (typeof initialAudioEnabled === 'undefined' && audio.mic_default_on) {
      setInitialAudioEnabled(audio.mic_default_on);
    }
    if (typeof initialVideoEnabled === 'undefined' && video.camera_default_on) {
      setInitialVideoState(DEVICE_STATE.starting);
    }
  }, [initialAudioEnabled, initialVideoEnabled, settings]);

  const publishVideoStream = useVideoPublisher({
    initialVideoMuted: !initialVideoState.enabled,
    videoDeviceId: selectedVideoDeviceId,
  });
  const publishAudioStream = useAudioPublisher({
    initialAudioMuted: !initAudioEnabled,
    audioDeviceId: selectedAudioInputDeviceId,
  });

  const stopPublishingAudio = useCallback(async () => {
    if (
      callingState === CallingState.IDLE ||
      callingState === CallingState.RINGING
    ) {
      setInitialAudioEnabled(false);
    } else {
      call?.stopPublish(SfuModels.TrackType.AUDIO);
    }
  }, [call, callingState]);

  const stopPublishingVideo = useCallback(async () => {
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
    () => setInitialAudioEnabled((prev) => !prev),
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
    hasBrowserPermissionAudioInput,
    selectedAudioInputDeviceId,
  );
  useAudioOutputDeviceFallback(
    () => switchDevice('audiooutput', DEFAULT_DEVICE_ID),
    // audiooutput devices can be enumerated only with microphone permissions
    hasBrowserPermissionAudioInput,
    selectedAudioOutputDeviceId,
  );
  useVideoDeviceFallback(
    () => switchDevice('videoinput', DEFAULT_DEVICE_ID),
    hasBrowserPermissionVideoInput,
    selectedVideoDeviceId,
  );

  useEffect(() => {
    if (!call || callingState !== CallingState.JOINED) return;
    call.setAudioOutputDevice(selectedAudioOutputDeviceId);
  }, [call, callingState, selectedAudioOutputDeviceId]);

  useEffect(() => {
    // audiooutput devices can be enumerated only with microphone permissions
    if (!localParticipant$ || !hasBrowserPermissionAudioInput) return;

    const subscription = watchForDisconnectedAudioOutputDevice(
      localParticipant$.pipe(map((p) => p?.audioOutputDeviceId)),
    ).subscribe(async () => {
      selectAudioOutputDeviceId(DEFAULT_DEVICE_ID);
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [hasBrowserPermissionAudioInput, localParticipant$]);

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
 * Context consumer retrieving MediaDevicesContextAPI.
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
