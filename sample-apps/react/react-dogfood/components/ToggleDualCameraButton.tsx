import {
  DeviceSelectorVideo,
  OwnCapability,
  Restricted,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';
import {
  CameraUnavailableNotification,
  useCameraUnavailable,
} from './CameraUnavailableNotification';
import { DegradedPerformanceNotification } from './DegradedPerformanceNotification';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleDualCameraButton = () => {
  const { t } = useAppI18n();
  const cameraUnavailable = useCameraUnavailable();
  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]} hasPermissionsOnly>
      <div className="rd__dual-toggle">
        <DegradedPerformanceNotification className="rd__call-controls__notification" />
        <CameraUnavailableNotification
          {...cameraUnavailable}
          className="rd__call-controls__notification"
        >
          <ToggleVideoPublishingButton
            Menu={
              <DeviceSelectorVideo
                visualType="list"
                title={t('common.camera.label', 'Camera')}
              />
            }
            menuPlacement="top"
            onError={cameraUnavailable.onError}
          />
        </CameraUnavailableNotification>
      </div>
    </Restricted>
  );
};
