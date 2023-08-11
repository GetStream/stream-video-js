import { useEffect } from 'react';
import { v1 as uuid } from 'uuid';
import { CallingState, useCallStateHooks } from '@stream-io/video-react-sdk';
import { Info } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useCallStateNotification = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const { addNotification } = useNotificationContext();

  useEffect(() => {
    if (callingState === CallingState.OFFLINE) {
      addNotification({
        id: uuid(),
        message: 'No internet connection',
        icon: <Info />,
      });
    }

    if (callingState === CallingState.RECONNECTING) {
      addNotification({
        id: uuid(),
        message: 'Reconnecting...',
        icon: <Info />,
      });
    }
  }, [callingState, addNotification]);
};
