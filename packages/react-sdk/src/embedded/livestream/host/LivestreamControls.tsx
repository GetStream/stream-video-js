import type { ReactNode } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted } from '@stream-io/video-react-bindings';
import {
  ReactionsButton,
  RecordCallConfirmationButton,
  ScreenShareButton,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '../../../components';
import { LivestreamDuration } from './LivestreamDuration';

export type LivestreamControlsProps = {
  actionButton: ReactNode;
  trailingContent?: ReactNode;
};

export const LivestreamControls = ({
  actionButton,
  trailingContent,
}: LivestreamControlsProps) => {
  return (
    <div className="str-video__embedded-call-controls str-video__call-controls">
      <div className="str-video__call-controls--group str-video__call-controls--options">
        <LivestreamDuration />
      </div>
      <div className="str-video__call-controls--group str-video__call-controls--media">
        <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
          <ToggleAudioPublishingButton />
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
        <RecordCallConfirmationButton />
        {actionButton}
      </div>
      <div className="str-video__call-controls--group str-video__call-controls--sidebar">
        {trailingContent}
      </div>
    </div>
  );
};
