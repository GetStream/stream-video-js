import { Call, StreamVideoClient, Struct } from '@stream-io/video-client';
import { useEffect } from 'react';
import { RoomType } from './LiveKitRoom';

export interface StatsProps {
  client: StreamVideoClient;
  room: RoomType;
  call: Call;
}

const intervalMs = 15000;

async function getStats(pc: RTCPeerConnection): Promise<Struct> {
  const stats = await pc.getStats();
  const s: Record<string, any> = {};
  stats.forEach((v) => (s[v.id] = v));
  return Struct.fromJson(s);
}

export const Stats = ({ client, room, call }: StatsProps) => {
  useEffect(() => {
    let handle: NodeJS.Timeout;
    const reportStats = async () => {
      [room.engine.subscriber?.pc, room.engine.publisher?.pc].forEach(
        async (pc) =>
          pc &&
          client.reportCallStats({
            callType: call.type,
            callId: call.id,
            stats: await getStats(pc),
          }),
      );
      handle = setTimeout(reportStats, intervalMs);
    };
    reportStats();
    return () => clearTimeout(handle);
  }, [
    call.id,
    call.type,
    client,
    room.engine.publisher?.pc,
    room.engine.subscriber?.pc,
  ]);

  return null;
};
