import { PropsWithChildren, useEffect, useState } from 'react';
import { Placement } from '@floating-ui/react';
import { useCall, useI18n } from '@stream-io/video-react-bindings';
import { Notification } from './Notification';

export type MicCaptureErrorNotificationProps = {
  /**
   * Text message displayed by the notification.
   */
  text?: string;
  placement?: Placement;
};

export const MicCaptureErrorNotification = ({
  children,
  text,
  placement,
}: PropsWithChildren<MicCaptureErrorNotificationProps>) => {
  const call = useCall();
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    if (!call) return;
    return call.on('mic.capture_report', (event) => {
      setIsVisible(!event.capturesAudio);
    });
  }, [call]);

  const message =
    text ??
    t('Your microphone is not capturing audio. Please check your setup.');

  return (
    <Notification
      message={message}
      isVisible={isVisible}
      placement={placement || 'top-start'}
      close={() => setIsVisible(false)}
    >
      {children}
    </Notification>
  );
};
