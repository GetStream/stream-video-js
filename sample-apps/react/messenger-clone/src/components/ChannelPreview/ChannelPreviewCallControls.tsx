import {
  AcceptCallButton,
  CallingState,
  CancelCallButton,
  useCall,
} from '@stream-io/video-react-sdk';
import { useChatContext } from 'stream-chat-react';
import { useCallCallingState } from '../../hooks/useCallCallingState';

export const ChannelPreviewCallControls = () => {
  const { channel: activeChannel } = useChatContext();
  const call = useCall();
  const callingState = useCallCallingState();

  const callingToActiveChannel =
    activeChannel && call && activeChannel.id === call.data?.custom.channelId;

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
