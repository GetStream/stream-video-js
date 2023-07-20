import {
  AudioOutputLevelSlider,
  DeviceSelectorAudioOutput,
} from '@stream-io/video-react-sdk';

export const AudioOutputMenu = () => (
  <>
    <DeviceSelectorAudioOutput />
    <AudioOutputLevelSlider />
  </>
);
