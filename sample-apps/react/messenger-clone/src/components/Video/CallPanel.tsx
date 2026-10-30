import {
  CallingState,
  CancelCallButton,
  PaginatedGridLayout,
  RingingCall,
  ScreenShareButton,
  SpeakingWhileMutedNotification,
  ToggleAudioPublishingButton,
  ToggleVideoPublishingButton,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useWorkspaceNavigation } from 'stream-chat-react';
import { useState } from 'react';
import { useDraggable } from '../../hooks';

export const CallPanel = () => {
  const call = useCall();
  const { useCallCallingState, useCallCustomData } = useCallStateHooks();
  const callingState = useCallCallingState();
  const customData = useCallCustomData();
  const { isChannelActive, isThreadsView } = useWorkspaceNavigation();
  const [panelElement, setPanelElement] = useState<HTMLDivElement | null>(null);
  useDraggable(panelElement);

  if (!call) return null;

  // in the channels view, rings for other channels show in their sidebar row;
  // the threads view has no sidebar, so it shows every ring here
  const callingToActiveChannel = isChannelActive(customData.channelCid);
  if (
    CallingState.RINGING === callingState &&
    !callingToActiveChannel &&
    !isThreadsView
  )
    return null;

  if (callingState === CallingState.JOINED) {
    return (
      <div
        className="str-video__call-panel rmc__call-panel-wrapper"
        ref={setPanelElement}
      >
        <PaginatedGridLayout groupSize={4} />
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
        <RingingCall />
      </div>
    );
  }

  return null;
};
