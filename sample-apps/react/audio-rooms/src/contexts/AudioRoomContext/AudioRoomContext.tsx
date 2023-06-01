import { Call } from '@stream-io/video-client';

import {
  ReactNode,
  createContext,
  useContext,
  useState,
  useCallback,
} from 'react';
import { AudioRoom, roomFromCall } from '../../data/audioRoom';

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
  roomCreated: () => void;
  setRooms: (calls: Call[]) => void;
}

const defaultState: AudioRoomsState = {
  state: AudioRoomState.Overview,
  currentRoom: undefined,
  liveRooms: [],
  upcomingRooms: [],
  join: (_: AudioRoom) => {},
  leave: () => {},
  create: () => {},
  roomCreated: () => {},
  setRooms: (calls: Call[]) => {},
};

const AudioRoomContext = createContext<AudioRoomsState>(defaultState);

export const AudioRoomContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<AudioRoomsState>(defaultState);

  console.log('Initiate AudioRoomContextProvider');

  myState.join = useCallback(
    (room: AudioRoom) => {
      setMyState({
        ...myState,
        state: AudioRoomState.Joined,
        currentRoom: room,
      });
    },
    [myState],
  );

  myState.leave = useCallback(() => {
    setMyState({
      ...myState,
      state: AudioRoomState.Overview,
      currentRoom: undefined,
    });
  }, [myState]);

  myState.create = useCallback(() => {
    setMyState({
      ...myState,
      state: AudioRoomState.Create,
    });
  }, [myState]);

  myState.roomCreated = useCallback(() => {
    setMyState({
      ...myState,
      state: AudioRoomState.Overview,
    });
  }, [myState]);

  myState.setRooms = useCallback(
    (calls: Call[]) => {
      const liveRooms: AudioRoom[] = [];
      const upcomingRooms: AudioRoom[] = [];
      calls.forEach((call) => {
        const room = roomFromCall(call);

        // If the room has ended, don't show it here as people can't join anymore.
        if (call.state.metadata?.ended_at) {
          return;
        }

        // Check if call is currently live
        const isBackstage = call.state.metadata?.backstage;
        if (isBackstage) {
          upcomingRooms.push(room);
        } else {
          liveRooms.push(room);
        }
      });

      console.log(
        `Found ${upcomingRooms.length} upcoming and ${liveRooms.length} live rooms.`,
      );

      setMyState({
        ...myState,
        liveRooms: liveRooms,
        upcomingRooms: upcomingRooms,
      });
    },
    [myState],
  );

  return (
    <AudioRoomContext.Provider value={myState}>
      {children}
    </AudioRoomContext.Provider>
  );
};

export const useAudioRoomContext = () => useContext(AudioRoomContext);
