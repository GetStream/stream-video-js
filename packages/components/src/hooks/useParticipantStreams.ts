import { useEffect, useMemo, useState } from 'react';
import { Room } from '@stream-io/video-client-sfu';

export type UserStreamMap = {
  [userId: string]: MediaStream | undefined;
};

export const useParticipantStreams = (room: Room) => {
  const [userAudioStreams, setUserAudioStreams] = useState<UserStreamMap>({});
  const [userVideoStreams, setUserVideoStreams] = useState<UserStreamMap>({});
  useEffect(() => {
    // FIXME: OL: rework this!
    room.handleOnTrack = (e: RTCTrackEvent) => {
      e.track.addEventListener('mute', () => {
        console.log(`Track muted`, e.track.id, e.track);
      });

      e.track.addEventListener('unmute', () => {
        console.log(`Track unmuted`, e.track.id, e.track);
      });

      e.track.addEventListener('ended', () => {
        console.log(`Track ended`, e.track.id, e.track);
      });

      const [primaryStream] = e.streams;
      // format: <user-id>:<session-id>:<kind>
      const [name] = primaryStream.id.split(':');
      if (e.track.kind === 'video') {
        setUserVideoStreams((s) => ({
          ...s,
          [name]: primaryStream,
        }));
      } else if (e.track.kind === 'audio') {
        setUserAudioStreams((s) => ({
          ...s,
          [name]: primaryStream,
        }));
      }
    };
    return () => {
      room.handleOnTrack = undefined;
    };
  }, [room]);

  useEffect(() => {
    return room.on('participantLeft', (e) => {
      if (e.eventPayload.oneofKind !== 'participantLeft') return;
      const { participant } = e.eventPayload.participantLeft;
      if (participant) {
        const userId = participant.user!.id;
        setUserVideoStreams((s) => ({
          ...s,
          [userId]: undefined,
        }));
        setUserAudioStreams((s) => ({
          ...s,
          [userId]: undefined,
        }));
      }
    });
  }, [room]);

  return useMemo(
    () => ({ userAudioStreams, userVideoStreams }),
    [userAudioStreams, userVideoStreams],
  );
};
