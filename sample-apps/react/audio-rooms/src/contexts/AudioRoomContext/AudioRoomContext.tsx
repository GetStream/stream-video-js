import { ReactNode, createContext, useContext, useState } from 'react';
import { AudioRoom, audioRooms } from '../../data/audioRoom';

export enum AudioRoomState {
  Overview,
  Joined,
  Create,
}

export interface AudioRoomsState {
  state: AudioRoomState;
  currentRoom: AudioRoom | undefined;
  liveRooms: AudioRoom[];
  upcomingRooms: AudioRoom[];
  join: (room: AudioRoom) => void;
  leave: () => void;
  create: () => void;
}

const defaultState: AudioRoomsState = {
  state: AudioRoomState.Overview,
  currentRoom: undefined,
  // liveRooms: [],
  // upcomingRooms: [],
  liveRooms: audioRooms.slice(0, 3),
  upcomingRooms: audioRooms.slice(3, 4),
  join: (room: AudioRoom) => {},
  leave: () => {},
  create: () => {},
};

const AudioRoomContext = createContext<AudioRoomsState>(defaultState);

export const AudioRoomContextProvider = ({
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

  myState.leave = () => {
    setMyState({
      ...myState,
      state: AudioRoomState.Overview,
      currentRoom: undefined,
    });
  };

  myState.create = () => {
    setMyState({
      ...myState,
      state: AudioRoomState.Create,
    });
  };

  return (
    <AudioRoomContext.Provider value={myState}>
      {children}
    </AudioRoomContext.Provider>
  );
};

export const useAudioRoomContext = () => useContext(AudioRoomContext);
