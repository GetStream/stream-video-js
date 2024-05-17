import { SpeakingWhileMutedNotification } from '../Notification';
import { RecordCallButton } from './RecordCallButton';
import { ReactionsButton } from './ReactionsButton';
import { ScreenShareButton } from './ScreenShareButton';
import { ToggleAudioPublishingButton } from './ToggleAudioButton';
import { ToggleVideoPublishingButton } from './ToggleVideoButton';
import { CancelCallButton } from './CancelCallButton';

export type CallControlsProps = {
  onLeave?: () => void;
};

export const CallControls = ({ onLeave }: CallControlsProps) => (
  <div className="str-video__call-controls">
    <SpeakingWhileMutedNotification>
      <ToggleAudioPublishingButton />
    </SpeakingWhileMutedNotification>
    <ToggleVideoPublishingButton />
    <ReactionsButton />
    <ScreenShareButton />
    <RecordCallButton />
    <CancelCallButton onLeave={onLeave} />
  </div>
);
