import {
  PendingCallPanel,
  CallingState,
  CallParticipantsView,
  useCall,
  useCallCallingState,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleCameraPublishingButton,
  CancelCallButton,
} from '@stream-io/video-react-sdk';
import { useChatContext } from 'stream-chat-react';
import { useState } from 'react';
import { useDraggable } from '../../hooks/useDraggable';

export const CallPanel = () => {
  const call = useCall();
  const callingState = useCallCallingState();
  const { channel: activeChannel } = useChatContext();
  const [panelElement, setPanelElement] = useState<HTMLDivElement | null>(null);
  useDraggable(panelElement);

  if (!call) return null;

  const metadata = useCallMetadata();
  const callingToActiveChannel =
    activeChannel?.id === metadata?.custom.channelId;
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
          <ScreenShareButton call={call} />
          <SpeakingWhileMutedNotification>
            <ToggleAudioPublishingButton />
          </SpeakingWhileMutedNotification>
          <ToggleCameraPublishingButton />
          <CancelCallButton call={call} />
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
