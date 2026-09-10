import {
  DeviceSelectorVideo,
  OwnCapability,
  Restricted,
  ToggleVideoPublishingButton,
  useI18n,
} from '@stream-io/video-react-sdk';
import { DegradedPerformanceNotification } from './DegradedPerformanceNotification';

export const ToggleDualCameraButton = () => {
  const { t } = useI18n();
  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]} hasPermissionsOnly>
      <div className="rd__dual-toggle">
        <DegradedPerformanceNotification className="rd__call-controls__notification" />
        <ToggleVideoPublishingButton
          Menu={<DeviceSelectorVideo visualType="list" title={t('Camera')} />}
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
