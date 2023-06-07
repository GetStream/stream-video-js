import { useParams } from 'react-router-dom';
import {
  CallingState,
  PaginatedGridLayout,
  StreamCall,
  useCall,
  useCallCallingState,
  useConnectedUser,
  useMediaDevices,
} from '@stream-io/video-react-sdk';
import { BackstageHeader } from './ui/BackstageHeader';
import { BackstageControls } from './ui/BackstageControls';
import { useEffect } from 'react';

export const Backstage = () => {
  const { callId } = useParams();
  const connectedUser = useConnectedUser();
  if (!callId) return <h3>No Call ID is provided</h3>;
  if (!connectedUser) return <h3>Loading...</h3>;
  return (
    <StreamCall
      callType="default" // FIXME OL: change to 'livestream'
      callId={callId}
      autoJoin={true}
      data={{
        create: true,
        data: {
          members: [
            {
              user_id: connectedUser.id,
              role: 'host',
            },
          ],
        },
      }}
    >
      <BackstageUI />
    </StreamCall>
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
