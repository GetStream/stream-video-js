import { useEffect, useMemo } from 'react';
import type { Room } from 'livekit-client';
// @ts-ignore
import { WebRTCStats } from '@peermetrics/webrtc-stats';

// NOTE: OL: redeclared from @peermetrics/webrtc-stats as the internal types
// are incompatible with newer TS versions.
export interface WebRTCStatsConstructorOptions {
  getStatsInterval: number;
  rawStats: boolean;
  statsObject: boolean;
  filteredStats: boolean;
  wrapGetUserMedia: boolean;
  debug: boolean;
  remote: boolean;
  logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
}

export type TimelineTag =
  | 'getUserMedia'
  | 'peer'
  | 'connection'
  | 'track'
  | 'datachannel'
  | 'stats';

export interface StatsEvent {
  event: string;
  tag: TimelineTag;
  timestamp?: Date;
  data: any;
  peerId: string;
  connectionId: string;
  timeTaken: number;
  rawStats?: RTCStatsReport;
  statsObject?: any;
  filteredStats?: any;
}

export const useWebRtcStats = (
  room?: Room,
  options?: WebRTCStatsConstructorOptions,
) => {
  const webRtcStats = useMemo(() => {
    const opts: Partial<WebRTCStatsConstructorOptions> = {
      getStatsInterval: 5000,
      rawStats: true,
      ...options,
    };
    return new WebRTCStats(opts);
  }, [options]);

  useEffect(() => {
    if (!room) return;

    const subscriberPeerConnection = room.engine.subscriber?.pc;
    if (subscriberPeerConnection) {
      webRtcStats.addConnection({
        pc: subscriberPeerConnection,
        peerId: 'subscriber',
      });
    }

    const publisherPeerConnection = room.engine.publisher?.pc;
    if (publisherPeerConnection) {
      webRtcStats.addConnection({
        pc: publisherPeerConnection,
        peerId: 'publisher',
      });
    }

    return () => {
      webRtcStats.removeConnection({
        pc: subscriberPeerConnection,
        peerId: 'subscriber',
      });
      webRtcStats.removeConnection({
        pc: publisherPeerConnection,
        peerId: 'published',
      });
    };
  }, [room, webRtcStats]);
  return webRtcStats;
};
