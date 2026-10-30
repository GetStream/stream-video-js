import {
  AcceptCallButton,
  CallingState,
  CancelCallButton,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useWorkspaceNavigation } from 'stream-chat-react';

export const ChannelPreviewCallControls = () => {
  const { isChannelActive } = useWorkspaceNavigation();
  const call = useCall();
  const { useCallCallingState, useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();
  const callingState = useCallCallingState();

  const callingToActiveChannel = isChannelActive(customData.channelCid);

  const isRinging = callingState === CallingState.RINGING;

  if (call && isRinging && !callingToActiveChannel) {
    return (
      <div className="str-chat__channel-list-item__action-buttons str-chat__channel-list-item__action-buttons--active rmc__channel-preview__call-controls">
        <AcceptCallButton onClick={() => call.join()} />
        <CancelCallButton onClick={() => call.leave({ reject: true })} />
      </div>
    );
  }
  return null;
};
