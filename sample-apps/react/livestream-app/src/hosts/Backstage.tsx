import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  PaginatedGridLayout,
  StreamCall,
  useConnectedUser,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { BackstageHeader } from './ui/BackstageHeader';
import { BackstageControls } from './ui/BackstageControls';
import { useSetCall } from '../hooks/useSetCall';

export const Backstage = () => {
  const { callId } = useParams();
  const client = useStreamVideoClient();
  const connectedUser = useConnectedUser();
  const call = useSetCall(client);

  useEffect(() => {
    if (!(call && connectedUser)) return;

    call
      .getOrCreate({
        data: { members: [{ user_id: connectedUser.id, role: 'host' }] },
      })
      .then(() => {
        if (call.state.members.find((m) => m.user_id !== connectedUser.id)) {
          return call.updateCallMembers({
            update_members: [{ user_id: connectedUser.id, role: 'host' }],
          });
        }
      })
      .then(() => call.join())
      .catch((error) => console.error('Error joining call', error));
  }, [call, connectedUser]);

  if (!callId) return <h3>No Call ID is provided</h3>;
  if (!connectedUser) return <h3>Loading...</h3>;

  return (
    <>
      {call && (
        <StreamCall call={call}>
          <BackstageUI />
        </StreamCall>
      )}
    </>
  );
};

const BackstageUI = () => {
  return (
    <>
      <BackstageHeader />
      <PaginatedGridLayout />
      <BackstageControls />
    </>
  );
};
