import { Call } from '../Call';
import { Dispatcher } from '../rtc';
import { CallState } from '../store';
import {
  watchAudioLevelChanged,
  watchBlockedUser,
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

export const registerEventHandlers = (
  call: Call,
  state: CallState,
  dispatcher: Dispatcher,
) => {
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

    call.on('call.updated', watchCallUpdated(state)),

    call.on('call.blocked_user', watchBlockedUser(state)),
    call.on('call.unblocked_user', watchUnblockedUser(state)),

    call.on('call.reaction_new', watchNewReactions(state)),

    call.on('call.recording_started', watchCallRecordingStarted(state)),
    call.on('call.recording_stopped', watchCallRecordingStopped(state)),
    call.on('call.broadcasting_started', watchCallBroadcastingStarted(state)),
    call.on('call.broadcasting_stopped', watchCallBroadcastingStopped(state)),

    call.on('call.permission_request', watchCallPermissionRequest(state)),
    call.on('call.permissions_updated', watchCallPermissionsUpdated(state)),
    call.on('callGrantsUpdated', watchCallGrantsUpdated(state)),
  ];

  if (call.ringing) {
    // these events are only relevant when the call is ringing
    eventHandlers.push(registerRingingCallEventHandlers(call));
  }

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};

export const registerRingingCallEventHandlers = (call: Call) => {
  const eventHandlers = [
    call.on('call.rejected', watchCallRejected(call)),
    call.on('call.ended', watchCallEnded(call)),
  ];

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};
