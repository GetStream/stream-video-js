import { PropsWithChildren, useCallback, useState } from 'react';
import { Notification, useCallStateHooks } from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

/** The camera is held by another app, or failed to start in time. */
const CAMERA_UNAVAILABLE_ERRORS = new Set(['NotReadableError', 'AbortError']);

/**
 * State for a {@link CameraUnavailableNotification}; pass `onError` to the
 * camera toggle.
 */
export const useCameraUnavailable = () => {
  const { useCameraState } = useCallStateHooks();
  const { isEnabled } = useCameraState();
  const [isVisible, setIsVisible] = useState(false);

  if (isVisible && isEnabled) setIsVisible(false);

  const onError = useCallback((error: unknown) => {
    if (error instanceof Error && CAMERA_UNAVAILABLE_ERRORS.has(error?.name)) {
      setIsVisible(true);
    }
  }, []);

  return { isVisible, onError, close: () => setIsVisible(false) };
};

export const CameraUnavailableNotification = ({
  isVisible,
  close,
  className,
  children,
}: PropsWithChildren<
  ReturnType<typeof useCameraUnavailable> & { className?: string }
>) => {
  const { t } = useAppI18n();
  return (
    <Notification
      state="error"
      isVisible={isVisible}
      close={close}
      className={className}
      message={t(
        'notification.cameraUnavailable.text',
        "Couldn't start your camera. Close other apps that might be using it and try again.",
      )}
    >
      {children}
    </Notification>
  );
};
