import { useEffect } from 'react';
import { v1 as uuid } from 'uuid';
import { CallingState, useCallCallingState } from '@stream-io/video-react-sdk';

import { Signal, LoadingSpinner } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useConnectionNotification = () => {
  const { addNotification } = useNotificationContext();

  const callingState = useCallCallingState();

  useEffect(() => {
    let message = '';
    const isOffline = callingState === CallingState.OFFLINE;
    const hasFailedToRecover =
      callingState === CallingState.RECONNECTING_FAILED;

    const isRecoveringConnection = [
      CallingState.JOINING,
      CallingState.RECONNECTING,
    ].includes(callingState);

    if (isOffline || hasFailedToRecover) {
      message = isOffline
        ? 'You are offline. Check your internet connection and try again later.'
        : 'Failed to restore connection. Check your internet connection and try again later.';
    }

    if (isRecoveringConnection) {
      message = 'Reconnecting...';
    }

    if (isOffline || hasFailedToRecover || isRecoveringConnection) {
      addNotification({
        id: uuid(),
        message,
        icon: isRecoveringConnection ? <LoadingSpinner /> : <Signal />,
      });
    }
  }, [callingState]);
};
