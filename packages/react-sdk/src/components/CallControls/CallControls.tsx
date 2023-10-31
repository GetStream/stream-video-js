import { SpeakingWhileMutedNotification } from '../Notification';
import { RecordCallButton } from './RecordCallButton';
import { CallStatsButton } from './CallStatsButton';
import { ScreenShareButton } from './ScreenShareButton';
import { ToggleAudioPublishingButton } from './ToggleAudioButton';
import { ToggleVideoPublishingButton } from './ToggleVideoButton';
import { CancelCallButton } from './CancelCallButton';

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
