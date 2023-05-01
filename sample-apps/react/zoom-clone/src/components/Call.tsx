import { useState } from 'react';
import { StreamMeeting } from '@stream-io/video-react-sdk';
import { useParams } from 'react-router-dom';

import { MeetingUI } from './MeetingUI';
import { ChatSidebar } from './ChatSidebar';

export const Call = () => {
  const { callId } = useParams();
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="flex w-full h-full">
      <StreamMeeting
        callId={callId!}
        callType="default"
        data={{ create: true }}
      >
        <MeetingUI>
          <button
            onClick={() => setChatOpen((pv) => !pv)}
            className="absolute right-4 bg-zinc-600 rounded-full flex justify-center items-center text-white px-2 py-1"
          >
            {chatOpen ? 'Close' : 'Open'} chat
          </button>
        </MeetingUI>
      </StreamMeeting>

      {chatOpen && <ChatSidebar />}
    </div>
  );
};
