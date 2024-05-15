import { useCall } from '@stream-io/video-react-sdk';
import { useCallback, useEffect } from 'react';
import { beep } from '../lib/beeper';

export function useNotificationSounds() {
  const call = useCall();
  // We don't want to play the sound when the user joins themself
  const isSelf = useCallback(
    (userId: string) => userId !== call?.streamClient.userID,
    [call],
  );

  useEffect(() => {
    if (!call) {
      return;
    }

    const unlistenJoin = call.on('call.session_participant_joined', (event) => {
      if (!isSelf(event.participant.user.id)) {
        beep('/beeps/joined.mp3');
      }
    });

    const unlistenLeft = call.on('call.session_participant_left', (event) => {
      if (!isSelf(event.participant.user.id)) {
        beep('/beeps/left.mp3');
      }
    });

    return () => {
      unlistenJoin();
      unlistenLeft();
    };
  }, [call, isSelf]);
}
