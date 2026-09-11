import { PropsWithChildren, useEffect, useState } from 'react';
import { Placement } from '@floating-ui/react';
import { useCall } from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
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
    t(
      'notification.micCaptureError.text',
      'Your microphone is not capturing audio. Please check your setup.',
    );

  return (
    <Notification
      message={message}
      isVisible={isVisible}
      placement={placement}
      close={() => setIsVisible(false)}
    >
      {children}
    </Notification>
  );
};
