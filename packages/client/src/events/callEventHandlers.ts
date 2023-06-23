import { Call } from '../Call';
import { Dispatcher } from '../rtc';
import { CallState } from '../store';
import {
  watchAudioLevelChanged,
  watchBlockedUser,
  watchCallAccepted,
  watchCallBroadcastingStarted,
  watchCallBroadcastingStopped,
  watchCallEnded,
  watchCallGrantsUpdated,
  watchCallLiveStarted,
  watchCallMemberAdded,
  watchCallMemberRemoved,
  watchCallMemberUpdated,
  watchCallMemberUpdatedPermission,
  watchCallPermissionRequest,
  watchCallPermissionsUpdated,
  watchCallRecordingStarted,
  watchCallRecordingStopped,
  watchCallRejected,
  watchCallSessionEnded,
  watchCallSessionParticipantJoined,
  watchCallSessionParticipantLeft,
  watchCallSessionStarted,
  watchCallUpdated,
  watchChangePublishQuality,
  watchConnectionQualityChanged,
  watchDominantSpeakerChanged,
  watchNewReactions,
  watchParticipantCountChanged,
  watchParticipantJoined,
  watchParticipantLeft,
  watchTrackPublished,
  watchTrackUnpublished,
  watchUnblockedUser,
} from '../events';
import {
  CallEventTypes,
  StreamCallEvent,
} from '../coordinator/connection/types';

type RingCallEvents = Extract<
  CallEventTypes,
  'call.accepted' | 'call.rejected'
>;

type AllCallEvents = Exclude<
  CallEventTypes,
  | 'call.created' // handled by StreamVideoClient
  | 'call.ring' // handled by StreamVideoClient
  | 'call.notification' // not used currently
  | 'custom' // integrators should handle custom events
  | RingCallEvents // handled by registerRingingCallEventHandlers
>;

/**
 * Registers the default event handlers for a call during its lifecycle.
 *
 * @param call the call to register event handlers for.
 * @param state the call state.
 * @param dispatcher the dispatcher.
 */
export const registerEventHandlers = (
  call: Call,
  state: CallState,
  dispatcher: Dispatcher,
) => {
  const coordinatorEvents: {
    [key in AllCallEvents]: (e: StreamCallEvent) => any;
  } = {
    'call.blocked_user': watchBlockedUser(state),
    'call.broadcasting_started': watchCallBroadcastingStarted(state),
    'call.broadcasting_stopped': watchCallBroadcastingStopped(state),
    'call.ended': watchCallEnded(call),
    'call.live_started': watchCallLiveStarted(state),
    'call.member_added': watchCallMemberAdded(state),
    'call.member_removed': watchCallMemberRemoved(state),
    'call.member_updated': watchCallMemberUpdated(state),
    'call.member_updated_permission': watchCallMemberUpdatedPermission(state),
    'call.permission_request': watchCallPermissionRequest(state),
    'call.permissions_updated': watchCallPermissionsUpdated(state),
    'call.reaction_new': watchNewReactions(state),
    'call.recording_started': watchCallRecordingStarted(state),
    'call.recording_stopped': watchCallRecordingStopped(state),
    'call.session_started': watchCallSessionStarted(state),
    'call.session_ended': watchCallSessionEnded(state),
    'call.session_participant_joined': watchCallSessionParticipantJoined(state),
    'call.session_participant_left': watchCallSessionParticipantLeft(state),
    'call.unblocked_user': watchUnblockedUser(state),
    'call.updated': watchCallUpdated(state),
    'call.user_muted': () => console.log('call.user_muted received'),
  };
  const eventHandlers = [
    watchChangePublishQuality(dispatcher, call),
    watchConnectionQualityChanged(dispatcher, state),
    watchParticipantCountChanged(dispatcher, state),

    watchParticipantJoined(dispatcher, state),
    watchParticipantLeft(dispatcher, state),

    watchTrackPublished(dispatcher, state),
    watchTrackUnpublished(dispatcher, state),

    watchAudioLevelChanged(dispatcher, state),
    watchDominantSpeakerChanged(dispatcher, state),

    call.on('callGrantsUpdated', watchCallGrantsUpdated(state)),
  ];

  Object.keys(coordinatorEvents).forEach((event) => {
    const eventName = event as AllCallEvents;
    eventHandlers.push(call.on(eventName, coordinatorEvents[eventName]));
  });

  if (call.ringing) {
    // these events are only relevant when the call is ringing
    eventHandlers.push(registerRingingCallEventHandlers(call));
  }

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};

/**
 * Registers event handlers for a call that is of ringing type.
 *
 * @param call the call to register event handlers for.
 */
export const registerRingingCallEventHandlers = (call: Call) => {
  const coordinatorRingEvents: {
    [key in RingCallEvents]: (e: StreamCallEvent) => any;
  } = {
    'call.accepted': watchCallAccepted(call),
    'call.rejected': watchCallRejected(call),
  };

  const eventHandlers = Object.keys(coordinatorRingEvents).map((event) => {
    const eventName = event as RingCallEvents;
    return call.on(eventName, coordinatorRingEvents[eventName]);
  });

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};
