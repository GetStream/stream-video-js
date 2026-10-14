import { PropsWithChildren, useEffect, useState } from 'react';
import { Placement } from '@floating-ui/react';
import clsx from 'clsx';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import { Notification } from './Notification';

export type CameraUnavailableNotificationProps = {
  placement?: Placement;
  className?: string;
};

const UNAVAILABLE_ERRORS = ['NotReadableError', 'AbortError'];

const isCameraUnavailable = (error: Error | undefined) =>
  !!error?.name && UNAVAILABLE_ERRORS.includes(error.name);

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
  placement,
  className,
}: PropsWithChildren<CameraUnavailableNotificationProps>) => {
  const { useCameraState } = useCallStateHooks();
  const { error } = useCameraState();
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(() => isCameraUnavailable(error));

  useEffect(() => {
    setIsVisible(isCameraUnavailable(error));
  }, [error]);

  const message = (
    <>
      <span className="str-video__notification__line str-video__notification__title">
        {t('Camera unavailable')}
      </span>
      <span className="str-video__notification__line">
        {t('Close other apps that might be using your camera and try again.')}
      </span>
    </>
  );

  return (
    <Notification
      message={message}
      isVisible={isVisible}
      placement={placement}
      className={clsx('str-video__camera-unavailable-notification', className)}
      close={() => setIsVisible(false)}
    >
      {children}
    </Notification>
  );
};
