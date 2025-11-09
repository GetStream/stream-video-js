import {
  DeviceSelectorVideo,
  OwnCapability,
  Restricted,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';
import { DegradedPerformanceNotification } from './DegradedPerformanceNotification';

export const ToggleDualCameraButton = () => {
  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]} hasPermissionsOnly>
      <div className="rd__dual-toggle">
        <DegradedPerformanceNotification className="rd__dual-toggle__notifications" />
        <ToggleVideoPublishingButton
          Menu={<DeviceSelectorVideo visualType="list" />}
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
