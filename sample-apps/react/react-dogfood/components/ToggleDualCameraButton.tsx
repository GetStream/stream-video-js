import {
  DeviceSelectorVideo,
  OwnCapability,
  Restricted,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';
import { isMobile } from '../helpers/isMobile';
import { DegradedPerformanceNotification } from './DegradedPerformanceNotification';

export const ToggleDualCameraButton = () => {
  const visualType = isMobile() ? 'list' : 'preview';

  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]} hasPermissionsOnly>
      <div className="rd__dual-toggle">
        <DegradedPerformanceNotification className="rd__call-controls__notification" />
        <ToggleVideoPublishingButton
          Menu={<DeviceSelectorVideo visualType={visualType} />}
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
