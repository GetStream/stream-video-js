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

import {
  ChatWrapper,
  ChatUI,
  UnreadCountBadge,
  NewMessageNotification,
} from '.';

import { useWatchChannel } from '../hooks';

export const MeetingUI = ({
  chatClient,
  callId,
}: {
  chatClient: StreamChat | null;
  callId: string;
}) => {
  const router = useRouter();
  const activeCall = useActiveCall();
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const showSidebar = showParticipants || showChat;

  // FIXME: could be replaced with "notification.message_new" but users would have to be at least members
  // possible fix with "allow to join" permissions in place (expensive?)
  const channelWatched = useWatchChannel({ chatClient, channelId: callId });

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

  const { type } = activeCall.data.call;

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
            <NewMessageNotification
              chatClient={chatClient}
              channelWatched={channelWatched}
              disableOnChatOpen={showChat}
            >
              <div className="str-chat__chat-button__wrapper">
                <CallControlsButton
                  enabled={showChat}
                  disabled={!chatClient}
                  onClick={() => setShowChat((prev) => !prev)}
                  icon="chat"
                />
                {!showChat && (
                  <UnreadCountBadge
                    channelWatched={channelWatched}
                    chatClient={chatClient}
                    channelId={callId}
                  />
                )}
              </div>
            </NewMessageNotification>
          </div>
        </CallControls>
      </div>
      {showSidebar && (
        <div className="str-video__sidebar">
          {showParticipants && (
            <CallParticipantsList onClose={() => setShowParticipants(false)} />
          )}

          <ChatWrapper chatClient={chatClient}>
            {showChat && (
              <div className="str-video__chat">
                <ChatUI onClose={() => setShowChat(false)} channelId={callId} />
              </div>
            )}
          </ChatWrapper>
        </div>
      )}
    </div>
  );
};
