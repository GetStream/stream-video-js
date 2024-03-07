import {
  DeviceSelectorAudioInput,
  ToggleAudioPublishingButton,
} from '@stream-io/video-react-sdk';

export const ToggleDualMicButton = () => {
  return (
    <div className="rd__dual-toggle">
      <ToggleAudioPublishingButton
        Menu={<DeviceSelectorAudioInput visualType="list" title={undefined} />}
        menuPlacement="top"
      />
    </div>
  );
};
