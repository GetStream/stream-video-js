import { useCall } from '@stream-io/video-react-sdk';
import { useCallback, useEffect } from 'react';
import { beep } from '../lib/beeper';

export function useNotificationSounds() {
  const call = useCall();
  // We don't want to play the sound when the user joins themself
  const isSelf = useCallback(
    (userId: string) => userId === call?.currentUserId,
    [call],
  );

  useEffect(() => {
    if (!call) return;
    const unlistenJoin = call.on('call.session_participant_joined', (event) => {
      const { participantCount } = call.state;
      if (!isSelf(event.participant.user.id) && participantCount < 5) {
        beep('/beeps/joined.mp3').catch((e) => console.error(e));
      }
    });

    const unlistenLeft = call.on('call.session_participant_left', (event) => {
      const { participantCount } = call.state;
      if (!isSelf(event.participant.user.id) && participantCount < 5) {
        beep('/beeps/left.mp3').catch((e) => console.error(e));
      }
    });

    return () => {
      unlistenJoin();
      unlistenLeft();
    };
  }, [call, isSelf]);
}
