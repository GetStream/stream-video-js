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

export const CallControls = ({ onLeave }: CallControlsProps) => (
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
