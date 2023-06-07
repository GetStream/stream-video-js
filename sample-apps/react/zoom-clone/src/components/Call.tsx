import { useEffect, useState } from 'react';
import {
  Call,
  StreamCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useParams } from 'react-router-dom';

import { MeetingUI } from './MeetingUI';
import { ChatSidebar } from './ChatSidebar';

export const CallUI = () => {
  const { callId } = useParams();
  const client = useStreamVideoClient();
  const [chatOpen, setChatOpen] = useState(false);
  const [call, setCall] = useState<Call | undefined>(undefined);

  useEffect(() => {
    if (!callId || !client) {
      return;
    }

    setCall(client.call('default', callId));
  }, [client, callId]);

  useEffect(() => {
    if (!call) {
      return;
    }

    call.join({ create: true });
  }, [call]);

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
