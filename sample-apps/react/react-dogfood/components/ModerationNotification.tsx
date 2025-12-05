import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Notification, useCall } from '@stream-io/video-react-sdk';

export type ModerationNotificationProps = {
  text?: string;
};

export const ModerationNotification =
  ({}: PropsWithChildren<ModerationNotificationProps>) => {
    const call = useCall();
    const [isVisible, setVisible] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');

    const warningTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
    useEffect(() => {
      if (!call) return;

      const unsubscribe = call.on('call.moderation_warning', (event) => {
        setVisible(true);
        setMessage(event.message);

        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = setTimeout(() => {
          setVisible(false);
          warningTimeoutRef.current = undefined;
        }, 3000);
      });

      return () => {
        unsubscribe();
        clearTimeout(warningTimeoutRef.current);
        warningTimeoutRef.current = undefined;
      };
    }, [call]);

    return (
      <Notification message={message} isVisible={isVisible} placement="top" />
    );
  };
