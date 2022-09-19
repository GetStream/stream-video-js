import { Call, StreamVideoClient } from '@stream-io/video-client';
import { LiveKitRoom, RoomType } from '@stream-io/video-components-react';

export type StageViewProps = {
  client: StreamVideoClient;
  edgeUrl: string;
  edgeToken: string;
  currentCall?: Call;
  currentUser?: string;
  onConnected: (room: RoomType) => void;
  onLeave?: (room: RoomType) => void;
};

export const StageView = (props: StageViewProps) => {
  const {
    client,
    edgeUrl,
    edgeToken,
    onConnected,
    onLeave,
    currentCall,
    currentUser,
  } = props;
  return (
    <LiveKitRoom
      client={client}
      url={`wss://${edgeUrl}`}
      token={edgeToken}
      publishStats
      currentCall={currentCall}
      currentUser={currentUser}
      onLeave={onLeave}
      onConnected={(room) => {
        onConnected(room);
        room.localParticipant
          .enableCameraAndMicrophone()
          .then(() => {
            console.log('Camera and Mic enabled');
          })
          .catch((e: Error) => {
            console.error('Failed to get Camera and Mic permissions', e);
          });
      }}
    />
  );
};
