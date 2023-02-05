import { useEffect } from 'react';
import { useStreamVideoClient } from '@stream-io/video-react-bindings';
import { useParams } from 'react-router-dom';

import { MeetingUI } from './MeetingUI';
import { ChatSidebar } from './ChatSidebar';

export const Call = () => {
  const client = useStreamVideoClient();
  const { callId } = useParams();

  useEffect(() => {
    const joining = client?.joinCall({
      id: callId as string,
      datacenterId: '',
      type: 'default',
    });

    return () => {
      joining?.then((call) => call?.leave());
    };
  }, []);

  return (
    <div className="flex w-full h-full">
      <MeetingUI />

      <ChatSidebar />
    </div>
  );
};
