import { PropsWithChildren, useEffect, useState } from 'react';
import { useI18n } from '@stream-io/video-react-bindings';
import { useToggleCallRecording } from '../../hooks';
import { Notification } from './Notification';

export type RecordingInProgressNotificationProps = {
  text?: string;
};

export const RecordingInProgressNotification = ({
  children,
  text,
}: PropsWithChildren<RecordingInProgressNotificationProps>) => {
  const { t } = useI18n();
  const { isCallRecordingInProgress } = useToggleCallRecording();

  const [isVisible, setVisible] = useState(false);

  const message = text ?? t('Recording in progress...');

  useEffect(() => {
    if (isCallRecordingInProgress) {
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [isCallRecordingInProgress]);

  return (
    <Notification
      message={message}
      iconClassName="str-video__icon str-video__icon--recording-on"
      isVisible={isVisible}
      placement="top-start"
      close={() => setVisible(false)}
    >
      {children}
    </Notification>
  );
};
