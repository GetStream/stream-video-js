import { CallState } from '../store';
import { StreamVideoEvent } from '../coordinator/connection/types';

/**
 * Watch for call.session_started events and update the call metadata.
 *
 * @param state the call state.
 */
export const watchCallSessionStarted = (state: CallState) => {
  return function onCallSessionStarted(event: StreamVideoEvent) {
    if (event.type !== 'call.session_started') return;
    state.setMetadata(event.call);
  };
};

/**
 * Watch for call.session_ended events and update the call metadata.
 *
 * @param state the call state.
 */
export const watchCallSessionEnded = (state: CallState) => {
  return function onCallSessionEnded(event: StreamVideoEvent) {
    if (event.type !== 'call.session_ended') return;
    state.setMetadata(event.call);
  };
};

/**
 * Watch for call.session_participant_joined events and update the call metadata.
 *
 * @param state the call state.
 */
export const watchCallSessionParticipantJoined = (state: CallState) => {
  return function onCallParticipantJoined(event: StreamVideoEvent) {
    if (event.type !== 'call.session_participant_joined') return;
    const { Participant } = event;
    state.setMetadata((metadata) => {
      if (!metadata || !metadata.session) {
        state.logger(
          'warn',
          `Received call.session_participant_joined event but the metadata structure is invalid.`,
          event,
        );
        return metadata;
      }
      const { session } = metadata;
      const { participants, participants_count_by_role } = session;
      const { user } = Participant;
      return {
        ...metadata,
        session: {
          ...session,
          participants: [...participants, Participant],
          participants_count_by_role: {
            ...participants_count_by_role,
            [user.role]: (participants_count_by_role[user.role] || 0) + 1,
          },
        },
      };
    });
  };
};

/**
 * Watch for call.session_participant_left events and update the call metadata.
 *
 * @param state the call state.
 */
export const watchCallSessionParticipantLeft = (state: CallState) => {
  return function onCallParticipantLeft(event: StreamVideoEvent) {
    if (event.type !== 'call.session_participant_left') return;
    const { user, user_session_id } = event.Participant;
    state.setMetadata((metadata) => {
      if (!metadata || !metadata.session) {
        state.logger(
          'warn',
          `Received call.session_participant_left event but the metadata structure is invalid.`,
          event,
        );
        return metadata;
      }
      const { session } = metadata;
      const { participants, participants_count_by_role } = session;
      return {
        ...metadata,
        session: {
          ...session,
          participants: participants.filter(
            (p) => p.user_session_id !== user_session_id,
          ),
          participants_count_by_role: {
            ...participants_count_by_role,
            [user.role]: Math.max(
              0,
              (participants_count_by_role[user.role] || 0) - 1,
            ),
          },
        },
      };
    });
  };
};
