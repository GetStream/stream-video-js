import { useParams } from 'react-router-dom';

import { selectedUserSubject } from '../main';

import { ChatVideoWrapper } from './ChatVideoWrapper';
import { CreateCall } from './CreateCall';
import { JoinCall } from './JoinCall';

// cam preview - initial<audio/video> muted...
export const CallLobby = () => {
  const { callId } = useParams();

  // TODO: const { user: User } = useLoaderData();
  const user = selectedUserSubject.getValue();

  return (
    <ChatVideoWrapper user={user!}>
      {!callId && <CreateCall />}
      {callId && <JoinCall callId={callId} />}
    </ChatVideoWrapper>
  );
};
