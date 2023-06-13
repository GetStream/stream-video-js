import { Call } from '@stream-io/video-react-sdk';

export type RoomLiveState = 'live' | 'upcoming' | 'ended';

export const isUpcoming = (call: Call) =>
  !!call.state.metadata?.backstage && !call.state.metadata?.ended_at;
export const isLive = (call: Call) =>
  !(call.state.metadata?.backstage || call.state.metadata?.ended_at);
export const isEnded = (call: Call) => !!call.state.metadata?.ended_at;

export const roomStates: RoomLiveState[] = ['live', 'upcoming', 'ended'];
export const isRoomState: Record<RoomLiveState, (call: Call) => boolean> = {
  ended: isEnded,
  live: isLive,
  upcoming: isUpcoming,
};
