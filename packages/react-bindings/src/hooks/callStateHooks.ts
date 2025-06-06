import {
  Call,
  CallClosedCaption,
  CallIngressResponse,
  CallSessionResponse,
  CallSettingsResponse,
  CallState,
  CallStatsReport,
  Comparator,
  EgressResponse,
  InputDeviceStatus,
  MemberResponse,
  OwnCapability,
  StreamVideoParticipant,
  UserResponse,
} from '@stream-io/video-client';
import { useMemo, useState } from 'react';
import { Observable, of } from 'rxjs';
import { useCall } from '../contexts';
import { isReactNative } from '../helpers/platforms';
import { useObservableValue } from './useObservableValue';

// kind-of memoized, used as a default value
const EMPTY_DEVICES_ARRAY = Object.freeze<MediaDeviceInfo[]>(
  [],
) as MediaDeviceInfo[];

/**
 * Utility hook, which provides the current call's state.
 */
export const useCallState = () => {
  const call = useCall();
  // return an empty and unlinked CallState object if there is no call in the provider
  // this ensures that the hooks always return a value and many null checks can be avoided
  if (!call) {
    const message =
      'You are using useCallState() outside a Call context. ' +
      'Please wrap your component in <StreamCall /> and provide a "call" instance.';
    console.warn(message);
    return new CallState();
  }
  return call.state;
};

/**
 * Utility hook which provides information whether the current call is being recorded. It will return `true` if the call is being recorded.
 */
export const useIsCallRecordingInProgress = (): boolean => {
  const { recording$ } = useCallState();
  return useObservableValue(recording$);
};

/**
 * Utility hook which provides information whether the current call is broadcasting.
 */
export const useIsCallHLSBroadcastingInProgress = (): boolean => {
  const { egress$ } = useCallState();
  const egress = useObservableValue(egress$);
  if (!egress) return false;
  return egress.broadcasting;
};

/**
 * Utility hook which provides information whether the current call is live.
 */
export const useIsCallLive = (): boolean => {
  const { backstage$ } = useCallState();
  const isBackstageOn = useObservableValue(backstage$);
  return !isBackstageOn;
};

/**
 * Returns the list of blocked users in the current call.
 */
export const useCallBlockedUserIds = (): string[] => {
  const { blockedUserIds$ } = useCallState();
  return useObservableValue(blockedUserIds$);
};

/**
 * Returns the timestamp when this call was created.
 */
export const useCallCreatedAt = (): Date | undefined => {
  const { createdAt$ } = useCallState();
  return useObservableValue(createdAt$);
};

/**
 * Returns the timestamp when this call was ended.
 */
export const useCallEndedAt = (): Date | undefined => {
  const { endedAt$ } = useCallState();
  return useObservableValue(endedAt$);
};

/**
 * Returns the timestamp telling when the call is scheduled to start.
 */
export const useCallStartsAt = (): Date | undefined => {
  const { startsAt$ } = useCallState();
  return useObservableValue(startsAt$);
};

/**
 * Returns the timestamp when this call was updated.
 */
export const useCallUpdatedAt = (): Date | undefined => {
  const { updatedAt$ } = useCallState();
  return useObservableValue(updatedAt$);
};

/**
 * Returns the information about the call's creator.
 */
export const useCallCreatedBy = (): UserResponse | undefined => {
  const { createdBy$ } = useCallState();
  return useObservableValue(createdBy$);
};

/**
 * Returns the call's custom data.
 */
export const useCallCustomData = (): Record<string, any> => {
  const { custom$ } = useCallState();
  return useObservableValue(custom$);
};

/**
 * Returns the call's Egress information.
 */
export const useCallEgress = (): EgressResponse | undefined => {
  const { egress$ } = useCallState();
  return useObservableValue(egress$);
};

/**
 * Returns the call's Ingress information.
 */
export const useCallIngress = (): CallIngressResponse | undefined => {
  const { ingress$ } = useCallState();
  return useObservableValue(ingress$);
};

/**
 * Returns the data for the current call session.
 */
export const useCallSession = (): CallSessionResponse | undefined => {
  const { session$ } = useCallState();
  return useObservableValue(session$);
};

/**
 * Returns the call's settings.
 */
export const useCallSettings = (): CallSettingsResponse | undefined => {
  const { settings$ } = useCallState();
  return useObservableValue(settings$);
};

/**
 * Returns whether the call has transcribing enabled.
 */
export const useIsCallTranscribingInProgress = (): boolean => {
  const { transcribing$ } = useCallState();
  return useObservableValue(transcribing$);
};

/**
 * Returns information about the user who has marked this call as ended.
 */
export const useCallEndedBy = (): UserResponse | undefined => {
  const { endedBy$ } = useCallState();
  return useObservableValue(endedBy$);
};

/**
 * Utility hook which provides a boolean indicating whether there is
 * a participant in the current call which shares their screen.
 */
export const useHasOngoingScreenShare = (): boolean => {
  const { hasOngoingScreenShare$ } = useCallState();
  return useObservableValue(hasOngoingScreenShare$);
};

/**
 * Utility hook which provides the latest stats report of the current call.
 *
 * The latest stats report of the current call.
 * When stats gathering is enabled, this observable will emit a new value
 * at a regular (configurable) interval.
 *
 * Consumers of this observable can implement their own batching logic
 * in case they want to show historical stats data.
 */
export const useCallStatsReport = (): CallStatsReport | undefined => {
  const { callStatsReport$ } = useCallState();
  return useObservableValue(callStatsReport$);
};

/**
 * Utility hook which provides the dominant speaker of the current call.
 */
export const useDominantSpeaker = (): StreamVideoParticipant | undefined => {
  const { dominantSpeaker$ } = useCallState();
  return useObservableValue(dominantSpeaker$);
};

/**
 * Utility hook which provides a list of call members.
 */
export const useCallMembers = (): MemberResponse[] => {
  const { members$ } = useCallState();
  return useObservableValue(members$);
};

/**
 * Utility hook providing the current calling state of the call. For example, `RINGING` or `JOINED`.
 */
export const useCallCallingState = () => {
  const { callingState$ } = useCallState();
  return useObservableValue(callingState$);
};

/**
 * Utility hook providing the actual start time of the current session.
 * Useful for calculating the call duration.
 */
export const useCallStartedAt = () => {
  const { startedAt$ } = useCallState();
  return useObservableValue(startedAt$);
};

/**
 * A hook which provides a list of all participants that have joined an active call.
 *
 * @param options.sortBy - A comparator function to sort the participants by.
 * Make sure to memoize output of the `combineComparators` function
 * (or keep it out of component's scope if possible) before passing it down to this property.
 */
export const useParticipants = ({
  sortBy,
}: {
  /**
   * Make sure to memoize output of the `combineComparators` function
   * (or keep it out of component's scope if possible) before passing it down to this property.
   */
  sortBy?: Comparator<StreamVideoParticipant>;
} = {}) => {
  const { participants$ } = useCallState();
  const participants = useObservableValue(participants$);

  return useMemo(() => {
    if (sortBy) {
      return [...participants].sort(sortBy);
    }
    return participants;
  }, [participants, sortBy]);
};

/**
 * A hook which provides a list of all participants that have joined an active call.
 * Unlike `useParticipants`, it returns a more stable reference that is not affected
 * by participant sort settings.
 *
 * @category Call State
 */
export const useRawParticipants = () => {
  const { rawParticipants$ } = useCallState();
  return useObservableValue(rawParticipants$);
};

/**
 * A hook which provides a StreamVideoLocalParticipant object.
 * It signals that I have joined a call.
 */
export const useLocalParticipant = () => {
  const { localParticipant$ } = useCallState();
  return useObservableValue(localParticipant$);
};

/**
 * A hook which provides a list of all other participants than me that have joined an active call.
 */
export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useCallState();
  return useObservableValue(remoteParticipants$);
};

/**
 * Returns the approximate participant count of the active call.
 * This includes the anonymous users as well, and it is computed on the server.
 */
export const useParticipantCount = () => {
  const { participantCount$ } = useCallState();
  return useObservableValue(participantCount$);
};

/**
 * Returns the approximate anonymous participant count of the active call.
 * The regular participants are not included in this count. It is computed on the server.
 */
export const useAnonymousParticipantCount = () => {
  const { anonymousParticipantCount$ } = useCallState();
  return useObservableValue(anonymousParticipantCount$);
};

/**
 * Returns the generated thumbnail of the current call, if enabled in settings.
 */
export const useCallThumbnail = () => {
  const { thumbnails$ } = useCallState();
  return useObservableValue(thumbnails$);
};

/**
 * A hook which returns the local participant's own capabilities.
 */
export const useOwnCapabilities = (): OwnCapability[] | undefined => {
  const { ownCapabilities$ } = useCallState();
  return useObservableValue(ownCapabilities$);
};

/**
 * Hook that returns true if the local participant has all the given permissions.
 *
 * @param permissions the permissions to check.
 */
export const useHasPermissions = (...permissions: OwnCapability[]): boolean => {
  const capabilities = useOwnCapabilities();
  return permissions.every((permission) => capabilities?.includes(permission));
};

/**
 * Returns the camera state of the current call.
 */
export const useCameraState = () => {
  const call = useCall();
  const { camera } = call as Call;

  const { state } = camera;
  const direction = useObservableValue(state.direction$);
  const mediaStream = useObservableValue(state.mediaStream$);
  const selectedDevice = useObservableValue(state.selectedDevice$);
  const { getDevices } = useLazyDeviceList(camera);
  const hasBrowserPermission = useObservableValue(state.hasBrowserPermission$);
  const isPromptingPermission = useObservableValue(
    state.isPromptingPermission$,
  );

  return {
    camera,
    direction,
    mediaStream,
    get devices() {
      return getDevices();
    },
    hasBrowserPermission,
    isPromptingPermission,
    selectedDevice,
    ...getComputedStatus(
      useObservableValue(state.status$),
      useObservableValue(state.optimisticStatus$),
    ),
  };
};

/**
 * Returns the microphone state of the current call.
 */
export const useMicrophoneState = () => {
  const call = useCall();
  const { microphone } = call as Call;

  const { state } = microphone;
  const mediaStream = useObservableValue(state.mediaStream$);
  const selectedDevice = useObservableValue(state.selectedDevice$);
  const { getDevices } = useLazyDeviceList(microphone);
  const hasBrowserPermission = useObservableValue(state.hasBrowserPermission$);
  const isPromptingPermission = useObservableValue(
    state.isPromptingPermission$,
  );
  const isSpeakingWhileMuted = useObservableValue(state.speakingWhileMuted$);

  return {
    microphone,
    mediaStream,
    get devices() {
      return getDevices();
    },
    selectedDevice,
    hasBrowserPermission,
    isPromptingPermission,
    isSpeakingWhileMuted,
    ...getComputedStatus(
      useObservableValue(state.status$),
      useObservableValue(state.optimisticStatus$),
    ),
  };
};

/**
 * Returns the speaker state of the current call.
 *
 * Note: This hook is not supported in React Native
 */
export const useSpeakerState = () => {
  if (isReactNative()) {
    throw new Error(
      'This feature is not supported in React Native. Please visit https://getstream.io/video/docs/reactnative/core/camera-and-microphone/#speaker-management for more details',
    );
  }
  const call = useCall();
  const { speaker } = call as Call;

  const { getDevices } = useLazyDeviceList(speaker);
  const selectedDevice = useObservableValue(speaker.state.selectedDevice$);

  return {
    speaker,
    get devices() {
      return getDevices();
    },
    selectedDevice,
    isDeviceSelectionSupported: speaker.state.isDeviceSelectionSupported,
  };
};

/**
 * Returns the Screen Share state of the current call.
 */
export const useScreenShareState = () => {
  const call = useCall();
  const { screenShare } = call as Call;

  return {
    screenShare,
    mediaStream: useObservableValue(screenShare.state.mediaStream$),
    ...getComputedStatus(
      useObservableValue(screenShare.state.status$),
      useObservableValue(screenShare.state.optimisticStatus$),
    ),
  };
};

/**
 * Returns incoming video settings for the current call, including
 * global and per-participant manual video quality overrides.
 */
export const useIncomingVideoSettings = () => {
  const call = useCall() as Call;
  const settings = useObservableValue(
    call.dynascaleManager.incomingVideoSettings$,
  );
  return settings;
};

/**
 * Returns the current call's closed captions queue.
 */
export const useCallClosedCaptions = (): CallClosedCaption[] => {
  const { closedCaptions$ } = useCallState();
  return useObservableValue(closedCaptions$);
};

/**
 * Returns the current call's closed captions queue.
 */
export const useIsCallCaptioningInProgress = (): boolean => {
  const { captioning$ } = useCallState();
  return useObservableValue(captioning$);
};

function getComputedStatus(
  status: InputDeviceStatus,
  pendingStatus: InputDeviceStatus,
) {
  const optimisticStatus = pendingStatus ?? status;

  return {
    status,
    optimisticStatus,
    isEnabled: status === 'enabled',
    isMute: status !== 'enabled',
    optimisticIsMute: optimisticStatus !== 'enabled',
    isTogglePending: optimisticStatus !== status,
  };
}

interface DeviceManagerLike {
  listDevices(): Observable<MediaDeviceInfo[]>;
}

function useLazyDeviceList(manager: DeviceManagerLike) {
  const placeholderDevices$ = useMemo(() => of(EMPTY_DEVICES_ARRAY), []);
  const [devices$, setDevices$] = useState(placeholderDevices$);
  const devices = useObservableValue(devices$, EMPTY_DEVICES_ARRAY);

  const getDevices = () => {
    if (devices$ === placeholderDevices$) {
      setDevices$(manager.listDevices());
    }

    return devices;
  };

  return { getDevices };
}
