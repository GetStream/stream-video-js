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

    call.join({
      create: true,
      data: {
        members: [
          {
            user_id: connectedUser.id,
            role: 'host',
          },
        ],
      },
    });
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
