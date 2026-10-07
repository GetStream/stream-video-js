import { PropsWithChildren, useEffect, useState } from 'react';
import { Placement } from '@floating-ui/react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../i18n';
import { Notification } from './Notification';

export type CameraUnavailableNotificationProps = {
  /**
   * Text message displayed by the notification.
   */
  text?: string;
  placement?: Placement;
  className?: string;
};

/**
 * Shows when the last attempt to start the camera failed (e.g. the camera is
 * in use by another app). Reads the error from the camera state, so it shows
 * failures that happened before it was mounted.
 *
 * For error-specific copy, build your own notification on top of
 * `useCameraState().error`.
 */
export const CameraUnavailableNotification = ({
  children,
  text,
  placement,
  className,
}: PropsWithChildren<CameraUnavailableNotificationProps>) => {
  const { useCameraState } = useCallStateHooks();
  const { error, hasBrowserPermission } = useCameraState();
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(!!error);

  useEffect(() => {
    setIsVisible(!!error);
  }, [error]);

  const message = text ?? (
    <>
      <span className="str-video__notification__line str-video__notification__title">
        {t('notification.cameraUnavailable.title', 'Camera unavailable')}
      </span>
      <span className="str-video__notification__line">
        {t(
          'notification.cameraUnavailable.description',
          'Close other apps that might be using your camera and try again.',
        )}
      </span>
    </>
  );

  return (
    <Notification
      message={message}
      state="error"
      isVisible={isVisible && hasBrowserPermission}
      placement={placement}
      className={className}
      close={() => setIsVisible(false)}
    >
      {children}
    </Notification>
  );
};
