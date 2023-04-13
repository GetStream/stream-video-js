import { Call } from './Call';
import { Dispatcher } from './Dispatcher';
import { CallState } from '../store';
import {
  watchAudioLevelChanged,
  watchBlockedUser,
  watchCallPermissionRequest,
  watchCallPermissionsUpdated,
  watchCallRecordingStarted,
  watchCallRecordingStopped,
  watchCallUpdated,
  watchChangePublishQuality,
  watchConnectionQualityChanged,
  watchDominantSpeakerChanged,
  watchNewReactions,
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

    call.on('call.permission_request', watchCallPermissionRequest(state)),
    call.on('call.permissions_updated', watchCallPermissionsUpdated(state)),
  ];

  return () => {
    eventHandlers.forEach((unsubscribe) => unsubscribe());
  };
};
