import { StreamMeeting } from '@stream-io/video-react-sdk';

import { selectedUserSubject } from '../main';

import { MeetingUI } from './MeetingUI';
import { ChatSidebar } from './ChatSidebar';

export const JoinCall = ({ callId }: { callId: string }) => {
  // const user = useConnectedUser();
  const user = selectedUserSubject.getValue();

  return (
    <div className="flex w-full h-full">
      {/* <Preview /> */}
      <StreamMeeting
        currentUser={user?.id as string}
        callType={'default'}
        callId={callId}
      >
        <MeetingUI />
      </StreamMeeting>

      <ChatSidebar />
    </div>
  );
};
