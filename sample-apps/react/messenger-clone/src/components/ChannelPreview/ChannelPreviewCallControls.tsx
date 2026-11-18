import {
  AcceptCallButton,
  CallingState,
  CancelCallButton,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useSlotChannel } from 'stream-chat-react/slot-layout';

export const ChannelPreviewCallControls = () => {
  const activeChannel = useSlotChannel({ slot: 'channel', view: 'channels' });
  const call = useCall();
  const { useCallCallingState, useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();
  const callingState = useCallCallingState();

  const callingToActiveChannel =
    activeChannel && call && activeChannel.cid === customData.channelCid;

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
