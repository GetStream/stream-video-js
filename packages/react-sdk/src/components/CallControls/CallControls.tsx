import {
  CallStatsButton,
  CancelCallButton,
  RecordCallButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from './index';
import { SpeakingWhileMutedNotification } from '../Notification';

export type CallControlsProps = {
  onLeave?: () => void;
};

export const CallControls = (props: CallControlsProps) => {
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
