import { PropsWithChildren } from 'react';
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

  const message = text ?? t('Recording in progress...');

  return (
    <Notification
      message={message}
      iconClassName="str-video__icon str-video__icon--recording-on"
      isVisible={isCallRecordingInProgress}
      placement="top-start"
    >
      {children}
    </Notification>
  );
};
