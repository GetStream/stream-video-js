import { OwnCapability } from '@stream-io/video-client';
import { Restricted } from '@stream-io/video-react-bindings';
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
    <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
      <SpeakingWhileMutedNotification>
        <ToggleAudioPublishingButton />
      </SpeakingWhileMutedNotification>
    </Restricted>
    <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
      <ToggleVideoPublishingButton />
    </Restricted>
    <Restricted requiredGrants={[OwnCapability.CREATE_REACTION]}>
      <ReactionsButton />
    </Restricted>
    <Restricted requiredGrants={[OwnCapability.SCREENSHARE]}>
      <ScreenShareButton />
    </Restricted>
    <Restricted
      requiredGrants={[
        OwnCapability.START_RECORD_CALL,
        OwnCapability.STOP_RECORD_CALL,
      ]}
    >
      <RecordCallButton />
    </Restricted>
    <CancelCallButton onLeave={onLeave} />
  </div>
);
