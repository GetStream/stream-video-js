import { useEffect, useState } from 'react';
import { v1 as uuid } from 'uuid';
import { useIsCallRecordingInProgress } from '@stream-io/video-react-bindings';

import { Record } from '../components/Icons';

import { useNotificationContext } from '../contexts/NotificationsContext';

export const useScreenRecordingNotification = () => {
  const [recording, setRecording] = useState<boolean>(false);

  const { addNotification } = useNotificationContext();

  const isCallRecordingInProgress = useIsCallRecordingInProgress();

  useEffect(() => {
    if (isCallRecordingInProgress && recording === false) {
      addNotification({
        id: uuid(),
        message: 'Recording in progress',
        icon: <Record />,
      });
      setRecording(true);
    }

    if (!isCallRecordingInProgress && recording === true) {
      setRecording(false);
      addNotification({
        id: uuid(),
        message: 'Recording has ended',
      });
    }
  }, [isCallRecordingInProgress, recording]);
};
