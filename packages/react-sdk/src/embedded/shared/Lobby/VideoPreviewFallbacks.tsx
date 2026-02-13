import {
  useCallStateHooks,
  useConnectedUser,
  useI18n,
} from '@stream-io/video-react-bindings';
import { Avatar } from '../../../components';

export const DisabledVideoPreview = () => {
  const { t } = useI18n();
  const user = useConnectedUser();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();
  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

  return (
    <div className="str-video__embedded-lobby__no-permission">
      {hasBrowserMediaPermission ? (
        <Avatar imageSrc={user?.image} name={user?.name || user?.id} />
      ) : (
        <p>
          {t(
            'Please grant your browser permission to access your camera and microphone.',
          )}
        </p>
      )}
    </div>
  );
};

export const NoCameraPreview = () => {
  const { t } = useI18n();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();
  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();

  const hasBrowserMediaPermission = hasCameraPermission && hasMicPermission;

  if (!hasBrowserMediaPermission) {
    return (
      <div className="str-video__embedded-lobby__no-permission">
        <p>
          {t(
            'Please grant your browser permission to access your camera and microphone.',
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="str-video__video-preview__no-camera-preview">
      {t('No camera found')}
    </div>
  );
};
