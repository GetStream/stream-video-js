import {
  DeviceSelectorAudioInput,
  OwnCapability,
  Restricted,
  ToggleAudioPublishingButton,
} from '@stream-io/video-react-sdk';

export const ToggleDualMicButton = () => {
  return (
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]} hasPermissionsOnly>
      <div className="rd__dual-toggle">
        <ToggleAudioPublishingButton
          Menu={
            <DeviceSelectorAudioInput visualType="list" title={undefined} />
          }
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
