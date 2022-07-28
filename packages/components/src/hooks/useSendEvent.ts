import { useEffect } from 'react';
import { Participant, RoomEvent, TrackPublication } from 'livekit-client';
import { Call, UserEventType } from '@stream-io/video-client';
import { RoomType } from '../components';
import { useStreamVideoClient } from '../StreamVideo';

export const useSendEvent = (
  room?: RoomType,
  currentCall?: Call,
  currentUser?: string,
) => {
  const client = useStreamVideoClient();
  useEffect(() => {
    const handleTrackMuteUnmute = (
      track: TrackPublication,
      participant: Participant,
    ) => {
      // the LiveKit event fires for any participant within the call
      // we are interested only for current user's events
      if (currentUser !== participant.identity) return;

      let eventType;
      if (track.kind === 'audio') {
        eventType = track.isMuted
          ? UserEventType.AUDIO_MUTED_UNSPECIFIED
          : UserEventType.AUDIO_UNMUTED;
      } else if (track.kind === 'video') {
        eventType = track.isMuted
          ? UserEventType.VIDEO_STOPPED
          : UserEventType.VIDEO_STARTED;
      }

      // eventType.AUDIO_MUTED_UNSPECIFIED === 0; which is falsy value in JS
      if (typeof eventType !== 'undefined' && currentUser && currentCall) {
        client?.sendEvent({
          callType: currentCall.type,
          callId: currentCall.id,
          userId: currentUser,
          eventType: eventType,
        });
      }
    };

    room
      ?.on(RoomEvent.TrackMuted, handleTrackMuteUnmute)
      .on(RoomEvent.TrackUnmuted, handleTrackMuteUnmute);
    return () => {
      room
        ?.off(RoomEvent.TrackMuted, handleTrackMuteUnmute)
        .off(RoomEvent.TrackUnmuted, handleTrackMuteUnmute);
    };
  }, [client, room, currentCall, currentUser]);
};
