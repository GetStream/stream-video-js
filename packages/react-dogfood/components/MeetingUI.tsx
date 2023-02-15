import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useActiveCall } from '@stream-io/video-react-bindings';
import {
  DeviceSettings,
  LoadingIndicator,
  CallParticipantsList,
  Stage,
  CallControls,
  ToggleParticipantListButton,
  CallControlsButton,
} from '@stream-io/video-react-sdk';
import { StreamChat } from 'stream-chat';

import { ChatWrapper, ChatUI } from './';

export const MeetingUI = ({
  chatClient,
}: {
  chatClient: StreamChat | null;
}) => {
  const router = useRouter();
  const activeCall = useActiveCall();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const onLeave = useCallback(() => {
    router.push('/');
  }, [router]);

  if (!activeCall)
    return (
      <div className=" str-video str-video__call">
        <div className="str-video__call__loading-screen">
          <LoadingIndicator />
        </div>
      </div>
    );

  const { type, id: callId } = activeCall.data.call;
  const showSidebar = showParticipants || showChat;

  return (
    <div className="str-video str-video__call">
      <div className="str-video__call__main">
        <div className="str-video__call__header">
          <h4 className="str-video__call__header-title">
            {type}:{callId}
          </h4>
          <DeviceSettings activeCall={activeCall} />
        </div>
        <Stage call={activeCall} />
        <CallControls call={activeCall} onLeave={onLeave}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ToggleParticipantListButton
              enabled={showParticipants}
              onClick={() => setShowParticipants((prev) => !prev)}
            />
            <CallControlsButton
              enabled={showChat}
              disabled={!chatClient}
              onClick={() => setShowChat((prev) => !prev)}
              icon="chat"
            />
          </div>
        </CallControls>
      </div>
      {showSidebar && (
        <div className="str-video__sidebar">
          {showParticipants && (
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          )}

          <ChatWrapper client={chatClient}>
            {showChat && (
              <div className="str-video__chat">
                <ChatUI onClose={() => setShowChat(false)} callId={callId} />
              </div>
            )}
          </ChatWrapper>
        </div>
      )}
    </div>
  );
};
