import { PropsWithChildren } from 'react';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { Notification } from './Notification';

export type SpeakingWhileMutedNotificationProps = {
  /**
   * Text message displayed by the notification.
   */
  text?: string;
};

export const SpeakingWhileMutedNotification = ({
  children,
  text,
}: PropsWithChildren<SpeakingWhileMutedNotificationProps>) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  const { t } = useI18n();

  const message = text ?? t('You are muted. Unmute to speak.');
  return (
    <Notification message={message} isVisible={isSpeakingWhileMuted}>
      {children}
    </Notification>
  );
};
