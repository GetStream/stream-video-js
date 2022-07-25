import { useEffect, useMemo } from 'react';
import type { Room } from 'livekit-client';
// @ts-ignore
import { WebRTCStats } from '@peermetrics/webrtc-stats';
import type { WebRTCStatsConstructorOptions } from '@peermetrics/webrtc-stats/src/types';

export const useWebRtcStats = (
  room?: Room,
  options?: WebRTCStatsConstructorOptions,
) => {
  const webRtcStats = useMemo(() => {
    const opts: Partial<WebRTCStatsConstructorOptions> = {
      getStatsInterval: 5000,
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
