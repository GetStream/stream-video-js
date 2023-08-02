import { useEffect, useState } from 'react';
import { CallingState, StreamCall } from '@stream-io/video-react-sdk';

import { MeetingUI } from './MeetingUI';
import { ChatSidebar } from './ChatSidebar';
import { useSetCall } from '../hooks/useSetCall';
import { useJoinedCall } from '../contexts/JoinedCallProvider';

export const CallUI = () => {
  const call = useSetCall();
  const { setJoinedCall } = useJoinedCall();
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!call) {
      return;
    }

    call.join({ create: true });
    setJoinedCall(call);

    return () => {
      if (call.state.callingState !== CallingState.LEFT) {
        call.leave();
      }
      setJoinedCall(undefined);
    };
  }, [call, setJoinedCall]);

  return (
    <div className="flex w-full h-full">
      {call && (
        <StreamCall call={call}>
          <MeetingUI>
            <button
              onClick={() => setChatOpen((pv) => !pv)}
              className="absolute right-4 bg-zinc-600 rounded-full flex justify-center items-center text-white px-2 py-1"
            >
              {chatOpen ? 'Close' : 'Open'} chat
            </button>
          </MeetingUI>
        </StreamCall>
      )}

      {chatOpen && <ChatSidebar />}
    </div>
  );
};
