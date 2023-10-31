import { useEffect } from 'react';
import { v1 as uuid } from 'uuid';
import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { MicMuted } from '../components/Icons';
import { useNotificationContext } from '../contexts/NotificationsContext';

export const useSpeakingWhileMutedNotification = () => {
  const { addNotification } = useNotificationContext();
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();

  useEffect(() => {
    if (!isSpeakingWhileMuted) return;
    addNotification({
      id: uuid(),
      message: 'You are speaking while muted',
      icon: <MicMuted />,
    });
  }, [addNotification, isSpeakingWhileMuted]);
};
