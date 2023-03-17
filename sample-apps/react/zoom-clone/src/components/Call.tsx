import { useEffect, useState } from 'react';
import {
  StreamCallProvider,
  useActiveCall,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { useParams } from 'react-router-dom';

import { MeetingUI } from './MeetingUI';
import { ChatSidebar } from './ChatSidebar';

export const Call = () => {
  const client = useStreamVideoClient();
  const { callId } = useParams();
  const [chatOpen, setChatOpen] = useState(false);
  const activeCall = useActiveCall();

  useEffect(() => {
    const joining = client?.joinCall(callId as string, 'default');

    return () => {
      joining?.then((call) => call?.leave());
    };
  }, [callId, client]);

  if (!activeCall) return <div>Loading...</div>;

  return (
    <div className="flex w-full h-full">
      <StreamCallProvider call={activeCall}>
        <MeetingUI>
          <button
            onClick={() => setChatOpen((pv) => !pv)}
            className="absolute right-4 bg-zinc-600 rounded-full flex justify-center items-center text-white px-2 py-1"
          >
            {chatOpen ? 'Close' : 'Open'} chat
          </button>
        </MeetingUI>

        {chatOpen && <ChatSidebar />}
      </StreamCallProvider>
    </div>
  );
};
