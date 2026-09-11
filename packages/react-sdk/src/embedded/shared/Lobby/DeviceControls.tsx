import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../../i18n';
import {
  ToggleAudioPreviewButton,
  ToggleVideoPreviewButton,
  VideoPreview,
} from '../../../components';
import { ToggleMicButton } from './ToggleMicButton';
import { ToggleCameraButton } from './ToggleCameraButton';
import { DisabledDeviceButton } from './DisabledDeviceButton';
import { DisabledVideoPreview, NoCameraPreview } from './VideoPreviewFallbacks';

interface DeviceControlsProps {
  isVideoEnabled: boolean;
}

export const DeviceControls = ({ isVideoEnabled }: DeviceControlsProps) => {
  const { t } = useI18n();
  const { useCameraState, useMicrophoneState } = useCallStateHooks();

  const { hasBrowserPermission: hasCameraPermission } = useCameraState();
  const { hasBrowserPermission: hasMicPermission } = useMicrophoneState();

  return (
    <>
      <div className="str-video__embedded-lobby__video-preview">
        <VideoPreview
          DisabledVideoPreview={DisabledVideoPreview}
          NoCameraPreview={NoCameraPreview}
        />
        <div className="str-video__embedded-lobby__media-toggle">
          <ToggleAudioPreviewButton Menu={null} />
          {isVideoEnabled && <ToggleVideoPreviewButton Menu={null} />}
        </div>
      </div>

      <div className="str-video__embedded-lobby__media">
        {hasMicPermission ? (
          <ToggleMicButton />
        ) : (
          <DisabledDeviceButton
            icon="mic"
            label={t(
              'lobby.deviceControls.permissionNeeded.label',
              'Permission needed',
            )}
          />
        )}
        {isVideoEnabled &&
          (hasCameraPermission ? (
            <ToggleCameraButton />
          ) : (
            <DisabledDeviceButton
              icon="camera"
              label={t(
                'lobby.deviceControls.permissionNeeded.label',
                'Permission needed',
              )}
            />
          ))}
      </div>
    </>
  );
};
