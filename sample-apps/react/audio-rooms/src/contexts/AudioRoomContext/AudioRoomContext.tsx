import { Call } from '@stream-io/video-client';

import { ReactNode, createContext, useContext, useState } from 'react';
import { AudioRoom } from '../../data/audioRoom';

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
  // liveRooms: audioRooms.slice(0, 3),
  // upcomingRooms: audioRooms.slice(3, 4),
  join: (room: AudioRoom) => {},
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

  myState.roomCreated = () => {
    setMyState({
      ...myState,
      state: AudioRoomState.Overview,
    });
  };

  myState.setRooms = (calls: Call[]) => {
    const liveRooms: AudioRoom[] = [];
    const upcomingRooms: AudioRoom[] = [];
    calls.forEach((call) => {
      const participants = call.state.participantsSubject.getValue();
      console.log('------');
      console.log(`Call (${call.id}) has ${participants.length} participants.`);
      const customData = call.state.metadataSubject.getValue()?.custom;
      console.dir(call.state.metadataSubject.getValue());
      console.log('------');
      const room: AudioRoom = {
        id: call.id,
        title: customData?.title,
        subtitle: customData?.description,
        hosts: customData?.hosts,
        listeners: [],
        speakers: [],
        call: call,
      };
      if (participants.length > 0) {
        liveRooms.push(room);
      } else {
        upcomingRooms.push(room);
      }
    });

    setMyState({
      ...myState,
      liveRooms: liveRooms,
      upcomingRooms: upcomingRooms,
    });
  };

  return (
    <AudioRoomContext.Provider value={myState}>
      {children}
    </AudioRoomContext.Provider>
  );
};

export const useAudioRoomContext = () => useContext(AudioRoomContext);
