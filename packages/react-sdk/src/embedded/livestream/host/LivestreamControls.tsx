import type { ReactNode } from 'react';
import { OwnCapability } from '@stream-io/video-client';
import { Restricted } from '@stream-io/video-react-bindings';
import {
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
} from '../../../components';

export type LivestreamControlsProps = {
  actionButton: ReactNode;
};

export const LivestreamControls = ({
  actionButton,
}: LivestreamControlsProps) => {
  return (
    <div className="str-video__embedded-call-controls str-video__call-controls">
      <div className="str-video__call-controls--group str-video__call-controls--media">
        <Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
          <ToggleAudioPublishingButton />
        </Restricted>
        <Restricted requiredGrants={[OwnCapability.SEND_VIDEO]}>
          <ToggleVideoPublishingButton />
        </Restricted>
        {actionButton}
      </div>
    </div>
  );
};
