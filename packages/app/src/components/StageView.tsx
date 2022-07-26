import React from 'react';
import { Room, RoomType } from '@stream-io/video-components-react';
import { SelectEdgeServerResponse } from '@stream-io/video-client';

export type StageViewProps = {
  edge?: SelectEdgeServerResponse;
  onConnected: (room: RoomType) => void;
  onLeave?: (room: RoomType) => void;
};

export const StageView = (props: StageViewProps) => {
  const { edge, onConnected, onLeave } = props;
  if (!edge || !edge.edgeServer) {
    return null;
  }
  return (
    <Room
      url={`wss://${edge.edgeServer.url}`}
      token={edge.token}
      publishStats
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
