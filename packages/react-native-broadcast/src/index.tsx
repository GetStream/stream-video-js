import Broadcast from './NativeBroadcast';

export function multiply(a: number, b: number): Promise<number> {
  return Broadcast.multiply(a, b);
}

export { BroadcastVideoView } from './BroadcastVideoView';
export type { BroadcastVideoViewProps } from './BroadcastVideoView';
