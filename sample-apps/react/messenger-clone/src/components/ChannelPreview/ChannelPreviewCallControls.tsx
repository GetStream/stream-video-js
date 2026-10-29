import {
  AcceptCallButton,
  CallingState,
  CancelCallButton,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useWorkspaceNavigation } from 'stream-chat-react';

export const ChannelPreviewCallControls = () => {
  const { openChannels } = useWorkspaceNavigation();
  const call = useCall();
  const { useCallCallingState, useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();
  const callingState = useCallCallingState();

  const callingToActiveChannel =
    call && openChannels.some((c) => c.cid === customData.channelCid);

  const isRinging = callingState === CallingState.RINGING;

  if (call && isRinging && !callingToActiveChannel) {
    return (
      <div className="rmc__channel-preview__call-controls">
        <AcceptCallButton
          onClick={(e) => {
            e.stopPropagation();
            call.join();
          }}
        />
        <CancelCallButton
          onClick={(e) => {
            e.stopPropagation();
            call.leave({ reject: true });
          }}
        />
      </div>
    );
  }
  return null;
};
