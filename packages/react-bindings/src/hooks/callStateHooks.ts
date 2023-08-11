import { useMemo } from 'react';
import {
  Call,
  CallState,
  CameraManagerState,
  Comparator,
  MicrophoneManagerState,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { useCall } from '../contexts';
import { useObservableValue } from './useObservableValue';

/**
 * Utility hook, which provides the current call's state.
 *
 * @category Call State
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
 *
 * @category Call State
 */
export const useIsCallRecordingInProgress = () => {
  const metadata = useCallMetadata();
  return !!metadata?.recording;
};

/**
 * Utility hook which provides information whether the current call is broadcasting.
 *
 * @category Call State
 */
export const useIsCallBroadcastingInProgress = () => {
  const metadata = useCallMetadata();
  return !!metadata?.egress.broadcasting;
};

/**
 * Utility hook which provides information whether the current call is live.
 *
 * @category Call State
 */
export const useIsCallLive = () => {
  const metadata = useCallMetadata();
  if (!metadata) return false;
  return !metadata?.backstage;
};

/**
 * Utility hook which provides a boolean indicating whether there is
 * a participant in the current call which shares their screen.
 *
 * @category Call State
 */
export const useHasOngoingScreenShare = () => {
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
 *
 * @category Call State
 */
export const useCallStatsReport = () => {
  const { callStatsReport$ } = useCallState();
  return useObservableValue(callStatsReport$);
};

/**
 * Utility hook which provides the dominant speaker of the current call.
 *
 * @category Call State
 */
export const useDominantSpeaker = () => {
  const { dominantSpeaker$ } = useCallState();
  return useObservableValue(dominantSpeaker$);
};

/**
 * Utility hook which provides call metadata (such as blocked users and own capabilities).
 *
 * @category Call State
 * @deprecated will be removed in the next major release and replaced with more specific hooks.
 */
export const useCallMetadata = () => {
  const { metadata$ } = useCallState();
  return useObservableValue(metadata$);
};

/**
 * Utility hook which provides a list of call members.
 *
 * @category Call State
 */
export const useCallMembers = () => {
  const { members$ } = useCallState();
  return useObservableValue(members$);
};

/**
 * Utility hook providing the latest list of recordings performed during the active call
 *
 * @category Call State
 */
export const useCallRecordings = () => {
  const { callRecordingList$ } = useCallState();
  return useObservableValue(callRecordingList$);
};

/**
 * Utility hook providing the current calling state of the call. For example, `RINGING` or `JOINED`.
 *
 * @category Call State
 */
export const useCallCallingState = () => {
  const { callingState$ } = useCallState();
  return useObservableValue(callingState$);
};

/**
 * Utility hook providing the actual start time of the current session.
 * Useful for calculating the call duration.
 *
 * @category Call State
 */
export const useCallStartedAt = () => {
  const { startedAt$ } = useCallState();
  return useObservableValue(startedAt$);
};

/**
 * A hook which provides a list of all participants that have joined an active call.
 *
 * @category Call State
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
 * A hook which provides a StreamVideoLocalParticipant object.
 * It signals that I have joined a call.
 *
 * @category Call State
 */
export const useLocalParticipant = () => {
  const { localParticipant$ } = useCallState();
  return useObservableValue(localParticipant$);
};

/**
 * A hook which provides a list of all other participants than me that have joined an active call.
 *
 * @category Call State
 */
export const useRemoteParticipants = () => {
  const { remoteParticipants$ } = useCallState();
  return useObservableValue(remoteParticipants$);
};

/**
 * Returns the approximate participant count of the active call.
 * This includes the anonymous users as well, and it is computed on the server.
 *
 * @category Call State
 */
export const useParticipantCount = () => {
  const { participantCount$ } = useCallState();
  return useObservableValue(participantCount$);
};

/**
 * Returns the approximate anonymous participant count of the active call.
 * The regular participants are not included in this count. It is computed on the server.
 *
 * @category Call State
 */
export const useAnonymousParticipantCount = () => {
  const { anonymousParticipantCount$ } = useCallState();
  return useObservableValue(anonymousParticipantCount$);
};

/**
 * Returns the camera state of the current call.
 *
 * @category Camera Manager State
 *
 */
export const useCameraState = () => {
  const call = useCall();

  const status = useObservableValue(call?.camera.state.status$);
  const direction = useObservableValue(call?.camera.state.direction$);

  return {
    status,
    direction,
  };
};

/**
 * Returns the microphone state of the current call.
 *
 * @category Microphone Manager State
 */
export const useMicrophoneState = () => {
  const call = useCall();

  const status = useObservableValue(call?.microphone.state.status$);
  const selectedDevice = useObservableValue(
    call?.microphone.state.selectedDevice$,
  );

  return {
    status,
    selectedDevice,
  };
};
