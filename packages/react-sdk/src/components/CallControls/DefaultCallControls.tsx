import {
  CallStatsButton,
  CancelCallButton,
  RecordCallButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from './index';
import { SpeakingWhileMutedNotification } from '../Notification';

export type DefaultCallControlsProps = {
  onLeave?: () => void;
};

export const DefaultCallControls = (props: DefaultCallControlsProps) => {
  const { onLeave } = props;
  return (
    <div className="str-video__call-controls">
      <RecordCallButton />
      <CallStatsButton />
      <ScreenShareButton />
      <SpeakingWhileMutedNotification>
        <ToggleAudioPublishingButton />
      </SpeakingWhileMutedNotification>
      <ToggleVideoPublishingButton />
      <CancelCallButton onLeave={onLeave} />
    </div>
  );
};
