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
}

export interface AudioRoomsAPI {
  join: (room: AudioRoom) => void;
  leave: () => void;
  create: () => void;
  roomCreated: () => void;
  setRooms: (calls: Call[]) => void;
  updateRooms: () => void;
}

const defaultState: AudioRoomsState = {
  state: AudioRoomState.Overview,
  currentRoom: undefined,
  liveRooms: [],
  upcomingRooms: [],
};

const defaultAPI: AudioRoomsAPI = {
  join: (_: AudioRoom) => {},
  leave: () => {},
  create: () => {},
  roomCreated: () => {},
  setRooms: (_: Call[]) => {},
  updateRooms: () => {},
};

const AudioRoomContext = createContext<AudioRoomsState & AudioRoomsAPI>({
  ...defaultState,
  ...defaultAPI,
});

export const AudioRoomContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [myState, setMyState] = useState<AudioRoomsState>(defaultState);

  const join = useCallback((room: AudioRoom) => {
    setMyState((currentState) => ({
      ...currentState,
      state: AudioRoomState.Joined,
      currentRoom: room,
    }));
  }, []);

  const leave = useCallback(() => {
    setMyState((currentState) => ({
      ...currentState,
      state: AudioRoomState.Overview,
      currentRoom: undefined,
    }));
  }, []);

  const create = useCallback(() => {
    setMyState((currentState) => ({
      ...currentState,
      state: AudioRoomState.Create,
    }));
  }, []);

  const roomCreated = useCallback(() => {
    setMyState((currentState) => ({
      ...currentState,
      state: AudioRoomState.Overview,
    }));
  }, []);

  const setRooms = useCallback((calls: Call[]) => {
    const { liveRooms, upcomingRooms } = assignCallsToRooms(calls);

    console.log(
      `Found ${upcomingRooms.length} upcoming and ${liveRooms.length} live rooms.`,
    );

    setMyState((currentState) => ({
      ...currentState,
      liveRooms: liveRooms,
      upcomingRooms: upcomingRooms,
    }));
  }, []);

  const updateRooms = useCallback(() => {
    setMyState((currentState) => {
      const calls: Call[] = [
        ...(currentState.liveRooms
          .map((r) => r.call)
          .filter(Boolean) as Call[]),
        ...(currentState.upcomingRooms
          .map((r) => r.call)
          .filter(Boolean) as Call[]),
      ];
      const { liveRooms, upcomingRooms } = assignCallsToRooms(calls);
      return {
        ...currentState,
        liveRooms: liveRooms,
        upcomingRooms: upcomingRooms,
      };
    });
  }, []);

  function assignCallsToRooms(calls: Call[]): {
    liveRooms: AudioRoom[];
    upcomingRooms: AudioRoom[];
  } {
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
    return {
      liveRooms,
      upcomingRooms,
    };
  }

  return (
    <AudioRoomContext.Provider
      value={{
        ...myState,
        join,
        leave,
        create,
        roomCreated,
        setRooms,
        updateRooms,
      }}
    >
      {children}
    </AudioRoomContext.Provider>
  );
};

export const useAudioRoomContext = () => useContext(AudioRoomContext);
