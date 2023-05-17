import { Call } from '@stream-io/video-client';
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
  call: Call;
  onLeave?: () => void;
};

export const CallControls = (props: CallControlsProps) => {
  const { call, onLeave } = props;

  return (
    <div className="str-video__call-controls">
      <RecordCallButton call={call} />
      <CallStatsButton />
      <ScreenShareButton call={call} />
      <SpeakingWhileMutedNotification>
        <ToggleAudioPublishingButton />
      </SpeakingWhileMutedNotification>
      <ToggleVideoPublishingButton />
      <CancelCallButton call={call} onLeave={onLeave} />
    </div>
  );
};
