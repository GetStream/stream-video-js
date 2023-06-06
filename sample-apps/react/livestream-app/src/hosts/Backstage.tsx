import { useParams } from 'react-router-dom';
import {
  Call,
  CallingState,
  PaginatedGridLayout,
  StreamCall,
  useCall,
  useCallCallingState,
  useConnectedUser,
  useMediaDevices,
  useStreamVideoClient,
} from '@stream-io/video-react-sdk';
import { BackstageHeader } from './ui/BackstageHeader';
import { BackstageControls } from './ui/BackstageControls';
import { useEffect, useState } from 'react';

export const Backstage = () => {
  const { callId } = useParams();
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call | undefined>(undefined);
  const connectedUser = useConnectedUser();
  if (!callId) return <h3>No Call ID is provided</h3>;
  if (!connectedUser) return <h3>Loading...</h3>;

  useEffect(() => {
    if (!client) {
      return;
    }
    // FIXME OL: change to 'livestream'
    setCall(client.call('default', callId));
  }, [callId, client]);

  useEffect(() => {
    if (!call || !connectedUser) {
      return;
    }
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
  const call = useCall();
  const callState = useCallCallingState();
  const { publishVideoStream, publishAudioStream } = useMediaDevices();
  useEffect(() => {
    if (!call) return;
    if (callState === CallingState.JOINED) {
      publishVideoStream();
      publishAudioStream();
    }
  }, [call, callState, publishAudioStream, publishVideoStream]);
  return (
    <>
      <BackstageHeader />
      <PaginatedGridLayout />
      <BackstageControls />
    </>
  );
};
