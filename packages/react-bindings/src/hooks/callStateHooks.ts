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
import { useStateStore } from '@stream-io/state-store/react-bindings';
import type { CallStateShape, Subscribable } from '@stream-io/video-client';
import { useCall } from '../contexts';
import { isReactNative } from '../helpers/platforms';
import { useObservableValue } from './useObservableValue';

// kind-of memoized, used as a default value
const EMPTY_DEVICES_ARRAY = Object.freeze<MediaDeviceInfo[]>(
  [],
) as MediaDeviceInfo[];
const EMPTY_BLOCKED_SESSION_IDS = Object.freeze<string[]>([]) as string[];

export type UseInputMediaDeviceOptions = {
  /**
   * If `true`, the hook will use the optimistic status to determine whether the device is muted or not.
   */
  optimisticUpdates?: boolean;
};

/**
 * The state returned when there is no call in the provider.
 *
 * One shared instance rather than one per render: the hooks below feed it to
 * `useSyncExternalStore`, which re-subscribes whenever the source identity
 * changes, so a fresh `CallState` (a store, a preprocessor and 34 subscribable
 * views) every render would both allocate and churn subscriptions. Nothing
 * writes to it, so sharing it is safe.
 */
let detachedCallState: CallState | undefined;

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
    return (detachedCallState ??= new CallState());
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
 * Utility hook which provides information whether the raw track recording is running.
 */
export const useIsCallRawRecordingInProgress = (): boolean => {
  const { rawRecording$ } = useCallState();
  return useObservableValue(rawRecording$);
};

/**
 * Utility hook which provides information whether the individual track recording is running.
 */
export const useIsCallIndividualRecordingInProgress = (): boolean => {
  const { individualRecording$ } = useCallState();
  return useObservableValue(individualRecording$);
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
 * Returns whether end-to-end encryption is active for the current call.
 */
export const useE2eeEnabled = (): boolean => {
  const { e2eeEnabled$ } = useCallState();
  return useObservableValue(e2eeEnabled$);
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
 * When stats gathering is enabled, this will update
 * at a regular (configurable) interval.
 *
 * Consumers can implement their own batching logic
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
 * A hook which provides a list of participants that are currently pinned.
 */
export const usePinnedParticipants = () => {
  const { pinnedParticipants$ } = useCallState();
  return useObservableValue(pinnedParticipants$);
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

/** The state type held by a manager's store. */
type StoreState<S> = S extends { getLatestValue(): infer T } ? T : never;

// `useStateStore` treats the selector as part of its subscription identity, so
// these live at module scope to stay referentially stable across renders.
const selectCameraState = (
  state: StoreState<Call['camera']['state']['store']>,
) => ({
  direction: state.direction,
  mediaStream: state.mediaStream,
  rootMediaStream: state.rootMediaStream,
  selectedDevice: state.selectedDevice,
  hasBrowserPermission: state.hasBrowserPermission,
  isPromptingPermission: state.isPromptingPermission,
  status: state.status,
  optimisticStatus: state.optimisticStatus,
});

const selectMicrophoneState = (
  state: StoreState<Call['microphone']['state']['store']>,
) => ({
  mediaStream: state.mediaStream,
  selectedDevice: state.selectedDevice,
  hasBrowserPermission: state.hasBrowserPermission,
  isPromptingPermission: state.isPromptingPermission,
  speakingWhileMuted: state.speakingWhileMuted,
  audioBitrateProfile: state.audioBitrateProfile,
  status: state.status,
  optimisticStatus: state.optimisticStatus,
});

const selectSpeakerState = (
  state: StoreState<Call['speaker']['state']['store']>,
) => ({
  selectedDevice: state.selectedDevice,
  volume: state.volume,
});

const selectScreenShareState = (
  state: StoreState<Call['screenShare']['state']['store']>,
) => ({
  mediaStream: state.mediaStream,
  audioBitrateProfile: state.audioBitrateProfile,
  status: state.status,
  optimisticStatus: state.optimisticStatus,
});

/**
 * Reads several call state values in a single, tear-free subscription.
 *
 * Prefer the dedicated hooks below for individual values; reach for this when
 * a component needs a few of them and you would rather not stack subscriptions.
 *
 * The selector must be referentially stable - declare it at module scope, or
 * wrap it in `useCallback`.
 *
 * @example
 * ```ts
 * const selector = (state: CallStateShape) => ({
 *   callingState: state.callingState,
 *   participantCount: state.participantCount,
 * });
 * const { callingState, participantCount } = useCallStateSelector(selector);
 * ```
 */
export const useCallStateSelector = <
  O extends Readonly<Record<string, unknown>> | readonly unknown[],
>(
  selector: (state: CallStateShape) => O,
): O => {
  const { store } = useCallState();
  return useStateStore(store, selector);
};

/**
 * Returns the camera state of the current call.
 */
export const useCameraState = ({
  optimisticUpdates = true,
}: UseInputMediaDeviceOptions = {}) => {
  const call = useCall();
  const { camera } = call as Call;

  const { getDevices } = useLazyDeviceList(camera);
  // a single subscription covering every field this hook reads
  const snapshot = useStateStore(camera.state.store, selectCameraState);

  return {
    camera,
    direction: snapshot.direction,
    mediaStream: snapshot.mediaStream,
    rootMediaStream: snapshot.rootMediaStream,
    get devices() {
      return getDevices();
    },
    hasBrowserPermission: snapshot.hasBrowserPermission,
    isPromptingPermission: snapshot.isPromptingPermission,
    selectedDevice: snapshot.selectedDevice,
    ...getComputedStatus(snapshot.status, snapshot.optimisticStatus, {
      optimisticUpdates,
    }),
  };
};

/**
 * Returns the microphone state of the current call.
 */
export const useMicrophoneState = ({
  optimisticUpdates = true,
}: UseInputMediaDeviceOptions = {}) => {
  const call = useCall();
  const { microphone } = call as Call;

  const { getDevices } = useLazyDeviceList(microphone);
  const snapshot = useStateStore(microphone.state.store, selectMicrophoneState);

  return {
    microphone,
    mediaStream: snapshot.mediaStream,
    get devices() {
      return getDevices();
    },
    selectedDevice: snapshot.selectedDevice,
    hasBrowserPermission: snapshot.hasBrowserPermission,
    isPromptingPermission: snapshot.isPromptingPermission,
    isSpeakingWhileMuted: snapshot.speakingWhileMuted,
    audioBitrateProfile: snapshot.audioBitrateProfile,
    ...getComputedStatus(snapshot.status, snapshot.optimisticStatus, {
      optimisticUpdates,
    }),
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
      'This feature is not supported in React Native. Please visit https://getstream.io/video/docs/react-native/guides/camera-and-microphone/#speaker-management for more details',
    );
  }
  const call = useCall();
  const { speaker } = call as Call;

  const { getDevices } = useLazyDeviceList(speaker);
  const snapshot = useStateStore(speaker.state.store, selectSpeakerState);

  return {
    speaker,
    volume: snapshot.volume,
    get devices() {
      return getDevices();
    },
    selectedDevice: snapshot.selectedDevice,
    isDeviceSelectionSupported: speaker.state.isDeviceSelectionSupported,
  };
};

/**
 * Returns the Screen Share state of the current call.
 */
export const useScreenShareState = ({
  optimisticUpdates = true,
}: UseInputMediaDeviceOptions = {}) => {
  const call = useCall();
  const { screenShare } = call as Call;
  const snapshot = useStateStore(
    screenShare.state.store,
    selectScreenShareState,
  );
  return {
    screenShare,
    mediaStream: snapshot.mediaStream,
    audioBitrateProfile: snapshot.audioBitrateProfile,
    ...getComputedStatus(snapshot.status, snapshot.optimisticStatus, {
      optimisticUpdates,
    }),
  };
};

/**
 * Returns incoming video settings for the current call, including
 * global and per-participant manual video quality overrides.
 */
export const useIncomingVideoSettings = () => {
  const call = useCall() as Call;
  return useObservableValue(
    call.trackSubscriptionManager.incomingVideoSettings$,
  );
};

/**
 * Returns whether the browser's autoplay policy is blocking audio playback.
 *
 * When the browser blocks audio autoplay (e.g., no prior user interaction),
 * this hook returns `true`. Use `call.resumeAudio()` inside a click handler
 * to unblock audio playback. Returns `false` on React Native.
 */
export const useIsAutoplayBlocked = (): boolean => {
  const call = useCall();
  return useObservableValue(call?.blockedAudioTracker.autoplayBlocked$, false);
};

/**
 * Returns the participant `sessionId`s whose audio is currently blocked
 * by the browser's autoplay policy. Use it to render a per-participant audio
 * affordance; only some participants may be blocked. Returns an empty list on
 * React Native / when there is no call.
 */
export const useAutoplayBlockedSessionIds = (): string[] => {
  const call = useCall();
  return useObservableValue(
    call?.blockedAudioTracker.blockedSessionIds$,
    EMPTY_BLOCKED_SESSION_IDS,
  );
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
  options: Required<UseInputMediaDeviceOptions>,
) {
  const optimisticStatus = pendingStatus ?? status;

  return {
    status,
    optimisticStatus,
    isEnabled: status === 'enabled',
    isMute: status !== 'enabled',
    optimisticIsMute: optimisticStatus !== 'enabled',
    isTogglePending: optimisticStatus !== status,
    /**
     * If optimistic updates are enabled (`options.optimisticUpdates`), we
     * consider the optimistic status to determine whether the device is muted or not.
     * Otherwise, we rely on the actual status.
     */
    optionsAwareIsMute: options.optimisticUpdates
      ? optimisticStatus !== 'enabled'
      : status !== 'enabled',
  };
}

interface DeviceManagerLike {
  listDevices(): Subscribable<MediaDeviceInfo[]>;
}

function useLazyDeviceList(manager: DeviceManagerLike) {
  // `undefined` until something actually asks for the devices: enumerating
  // them prompts for permission, so it must not happen on mount
  const [devices$, setDevices$] = useState<
    Subscribable<MediaDeviceInfo[]> | undefined
  >(undefined);
  const devices = useObservableValue(devices$, EMPTY_DEVICES_ARRAY);

  const getDevices = () => {
    if (!devices$) {
      setDevices$(manager.listDevices());
    }

    return devices ?? EMPTY_DEVICES_ARRAY;
  };

  return { getDevices };
}
