import {
  CallingState,
  CallParticipantsView,
  CancelCallButton,
  PendingCallPanel,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useCallCallingState,
  useCallMetadata,
} from '@stream-io/video-react-sdk';
import { useChatContext } from 'stream-chat-react';
import { useState } from 'react';
import { useDraggable } from '../../hooks';

export const CallPanel = () => {
  const call = useCall();
  const callingState = useCallCallingState();
  const metadata = useCallMetadata();
  const { channel: activeChannel } = useChatContext();
  const [panelElement, setPanelElement] = useState<HTMLDivElement | null>(null);
  useDraggable(panelElement);

  if (!call) return null;

  const callingToActiveChannel =
    activeChannel?.cid === metadata?.custom.channelCid;
  // FIXME: currently does not show call panel when called from channel not loaded into state
  if (CallingState.RINGING === callingState && !callingToActiveChannel)
    return null;

  if (callingState === CallingState.JOINED) {
    return (
      <div
        className="str-video__call-panel rmc__call-panel-wrapper"
        ref={setPanelElement}
      >
        <CallParticipantsView call={call} />
        <div className="rmc__active-call-controls">
          <ScreenShareButton />
          <SpeakingWhileMutedNotification>
            <ToggleAudioPublishingButton />
          </SpeakingWhileMutedNotification>
          <ToggleVideoPublishingButton />
          <CancelCallButton />
        </div>
      </div>
    );
  } else if (
    [CallingState.RINGING, CallingState.JOINING].includes(callingState)
  ) {
    return (
      <div className="rmc__call-panel-wrapper" ref={setPanelElement}>
        <PendingCallPanel />
      </div>
    );
  }

  return null;
};
