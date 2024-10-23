import {
  DeviceSelectorVideo,
  OwnCapability,
  Restricted,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';

export const ToggleDualCameraButton = () => {
  return (
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]} hasPermissionsOnly>
      <div className="rd__dual-toggle">
        <ToggleVideoPublishingButton
          Menu={<DeviceSelectorVideo visualType="list" />}
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
