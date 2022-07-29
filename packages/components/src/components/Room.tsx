import { useState } from 'react';
import { DisplayContext, LiveKitRoom } from '@livekit/react-components';
import { Call } from '@stream-io/video-client';
import { Ping } from './Ping';
import { Stats } from './Stats';
import { useSendEvent } from '../hooks';

import type { Room as LiveKitRoomType } from 'livekit-client';
import '@livekit/react-components/dist/index.css';

export type RoomProps = {
  url: string;
  token: string;
  onConnected?: (room: LiveKitRoomType) => void;
  onLeave?: (room: LiveKitRoomType) => void;
  publishStats?: boolean;
  currentCall?: Call;
  currentUser?: string;
};

export type RoomType = LiveKitRoomType;

export const Room = (props: RoomProps) => {
  const {
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
      {publishStats && liveKitRoom && <Stats room={liveKitRoom} />}

      <DisplayContext.Provider value={{ stageLayout: 'grid', showStats: true }}>
        <LiveKitRoom
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
