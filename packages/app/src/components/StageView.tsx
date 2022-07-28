import React from 'react';
import { Room, RoomType } from '@stream-io/video-components-react';
import { Call } from '@stream-io/video-client';

export type StageViewProps = {
  edgeUrl: string;
  edgeToken: string;
  currentCall?: Call;
  currentUser?: string;
  onConnected: (room: RoomType) => void;
  onLeave?: (room: RoomType) => void;
};

export const StageView = (props: StageViewProps) => {
  const { edgeUrl, edgeToken, onConnected, onLeave, currentCall, currentUser } =
    props;
  return (
    <Room
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
