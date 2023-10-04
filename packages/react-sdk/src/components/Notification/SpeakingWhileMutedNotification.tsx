import { PropsWithChildren, useEffect, useState } from 'react';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { Notification } from './Notification';

export type SpeakingWhileMutedNotificationProps = {
  /**
   * Text message displayed by the notification.
   */
  text?: string;

  /**
   * Duration in milliseconds for which the notification should be displayed.
   * Default is 3500ms.
   */
  displayDuration?: number;
};

export const SpeakingWhileMutedNotification = ({
  children,
  text,
  displayDuration = 3500,
}: PropsWithChildren<SpeakingWhileMutedNotificationProps>) => {
  const { useMicrophoneState } = useCallStateHooks();
  const { isSpeakingWhileMuted } = useMicrophoneState();
  const { t } = useI18n();

  const [showNotification, setShowNotification] = useState(false);
  if (!showNotification && isSpeakingWhileMuted) {
    setShowNotification(true);
  }

  useEffect(() => {
    if (!showNotification) return;
    const timeout = setTimeout(() => {
      setShowNotification(false);
    }, displayDuration);
    return () => {
      clearTimeout(timeout);
      setShowNotification(false);
    };
  }, [showNotification, displayDuration]);

  const message = text ?? t('You are muted. Unmute to speak.');
  return (
    <Notification message={message} isVisible={showNotification}>
      {children}
    </Notification>
  );
};
