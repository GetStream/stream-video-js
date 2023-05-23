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
  watchCallPermissionRequest,
  watchCallPermissionsUpdated,
  watchCallRecordingStarted,
  watchCallRecordingStopped,
  watchCallRejected,
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
import { watchCallLiveStarted } from './backstage';
import {
  watchCallMemberAdded,
  watchCallMemberRemoved,
  watchCallMemberUpdated,
  watchCallMemberUpdatedPermission,
} from './members';

type RingCallEvents = Extract<
  CallEventTypes,
  'call.accepted' | 'call.rejected'
>;

// call.created is handled by the StreamVideoClient
// custom events should be handled by integrators
type AllCallEvents = Exclude<
  CallEventTypes,
  'call.created' | 'custom' | RingCallEvents
>;

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
    'call.session_ended': (event: StreamCallEvent) =>
      console.log(`Received ${event.type} event`, event),
    'call.session_participant_joined': (event: StreamCallEvent) =>
      console.log(`Received ${event.type} event`, event),
    'call.session_participant_left': (event: StreamCallEvent) =>
      console.log(`Received ${event.type} event`, event),
    'call.session_started': (event: StreamCallEvent) =>
      console.log(`Received ${event.type} event`, event),
    'call.unblocked_user': watchUnblockedUser(state),
    'call.updated': watchCallUpdated(state),
    'call.notification': (event: StreamCallEvent) =>
      console.log(`Received ${event.type} event`, event),
    'call.ring': (event: StreamCallEvent) =>
      console.log(`Received ${event.type} event`, event),
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
