import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
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
            <>
              <DeviceSelectorAudioOutput
                visualType="list"
                title="Speaker"
                speakerTestAudioUrl="/beeps/piano.mp3"
              />
              <DeviceSelectorAudioInput visualType="list" title="Microphone" />
            </>
          }
          menuPlacement="top"
        />
      </div>
    </Restricted>
  );
};
