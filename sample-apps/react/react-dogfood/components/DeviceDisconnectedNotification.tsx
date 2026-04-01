import { PropsWithChildren, useCallback, useEffect, useState } from 'react';
import {
  DeviceDisconnectedEvent,
  Notification,
  useCall,
  useI18n,
} from '@stream-io/video-react-sdk';

const getDeviceDisconnectedMessage = (
  kinds: Set<MediaDeviceKind>,
  t: (key: string) => string,
) => {
  const hasAudio = kinds.has('audioinput');
  const hasVideo = kinds.has('videoinput');

  if (hasAudio && hasVideo) {
    return t(
      'Your microphone and camera were disconnected. Please check your setup.',
    );
  }
  if (hasAudio) {
    return t('Your microphone was disconnected. Please check your setup.');
  }
  if (hasVideo) {
    return t('Your camera was disconnected. Please check your setup.');
  }

  return t('Your device was disconnected. Please check your setup.');
};

export type DeviceDisconnectedNotificationProps = {
  text?: string;
  className?: string;
};

export const DeviceDisconnectedNotification = ({
  children,
  text,
  className,
}: PropsWithChildren<DeviceDisconnectedNotificationProps>) => {
  const call = useCall();
  const { t } = useI18n();
  const [disconnectedDevices, setDisconnectedDevices] = useState<
    Set<MediaDeviceKind>
  >(new Set());

  useEffect(() => {
    if (!call) return;

    return call.on(
      'device.disconnected',
      ({ type, status, kind }: DeviceDisconnectedEvent) => {
        if (type !== 'device.disconnected' || status !== 'enabled') return;

        setDisconnectedDevices((prev) => new Set(prev).add(kind));
      },
    );
  }, [call]);

  const close = useCallback(() => setDisconnectedDevices(new Set()), []);

  const message = text ?? getDeviceDisconnectedMessage(disconnectedDevices, t);

  return (
    <Notification
      isVisible={disconnectedDevices.size > 0}
      placement="top-start"
      message={message}
      className={className}
      close={close}
    >
      {children}
    </Notification>
  );
};
