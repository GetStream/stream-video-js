import { ReactNode, createContext, useContext, useState } from 'react';
import { AudioRoom, audioRooms } from '../../data/audioRoom';

enum AudioRoomState {
  Overview,
  Joined,
}

export interface AudioRoomsState {
  state: AudioRoomState;
  currentRoom: AudioRoom | undefined;
  liveRooms: AudioRoom[];
  upcomingRooms: AudioRoom[];
  join: (room: AudioRoom) => void;
}

const defaultState: AudioRoomsState = {
  state: AudioRoomState.Overview,
  currentRoom: undefined,
  liveRooms: audioRooms.slice(0, 3),
  upcomingRooms: audioRooms.slice(3, 4),
  join: (room: AudioRoom) => {},
};

const AudioRoomContext = createContext<AudioRoomsState>(defaultState);

export const AudioRoomContextProvider: any = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<AudioRoomsState>(defaultState);

  myState.join = (room: AudioRoom) => {
    setMyState({
      ...myState,
      state: AudioRoomState.Joined,
      currentRoom: room,
    });
  };

  return (
    <AudioRoomContext.Provider value={myState}>
      {children}
    </AudioRoomContext.Provider>
  );
};

export const useAudioRoomContext = () => useContext(AudioRoomContext);
