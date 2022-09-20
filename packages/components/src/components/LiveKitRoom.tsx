import {
  DisplayContext,
  LiveKitRoom as LKRoom,
} from '@livekit/react-components';
import { Call, StreamVideoClient } from '@stream-io/video-client';
import { useState } from 'react';
import { useSendEvent } from '../hooks';
import { Ping } from './Ping';
import { Stats } from './Stats';

import '@livekit/react-components/dist/index.css';
import type { Room as LiveKitRoomType } from 'livekit-client';

export type RoomProps = {
  client: StreamVideoClient;
  url: string;
  token: string;
  onConnected?: (room: LiveKitRoomType) => void;
  onLeave?: (room: LiveKitRoomType) => void;
  publishStats?: boolean;
  currentCall?: Call;
  currentUser?: string;
};

export type RoomType = LiveKitRoomType;

export const LiveKitRoom = (props: RoomProps) => {
  const {
    client,
    url,
    token,
    onConnected,
    onLeave,
    publishStats,
    currentCall,
    currentUser,
  } = props;
  const [liveKitRoom, setLiveKitRoom] = useState<LiveKitRoomType | undefined>();
  useSendEvent(liveKitRoom, currentCall, currentUser);

  return (
    <div className="str-video__room">
      <Ping currentUser={currentUser} currentCall={currentCall} />
      {publishStats && liveKitRoom && currentCall && (
        <Stats room={liveKitRoom} call={currentCall} client={client} />
      )}

      <DisplayContext.Provider value={{ stageLayout: 'grid', showStats: true }}>
        <LKRoom
          url={url}
          token={token}
          roomOptions={{ adaptiveStream: true, dynacast: true }}
          onLeave={(room) => {
            if (onLeave) {
              onLeave(room);
            }
            setLiveKitRoom(undefined);
          }}
          onConnected={(room) => {
            setLiveKitRoom(room);
            if (onConnected) {
              onConnected(room);
            }
          }}
        />
      </DisplayContext.Provider>
    </div>
  );
};
