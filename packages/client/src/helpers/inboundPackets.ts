import type { Subscriber } from '../rtc';

/**
 * Sums `packetsReceived` over the subscriber's inbound RTP streams,
 * optionally only those of one media kind.
 */
export const countInboundPackets = async (
  subscriber: Pick<Subscriber, 'getStats'>,
  kind?: 'audio' | 'video',
) => {
  let packets = 0;
  const report = await subscriber.getStats();
  report.forEach((s) => {
    if (s.type === 'inbound-rtp' && (!kind || s.kind === kind)) {
      packets += s.packetsReceived ?? 0;
    }
  });
  return packets;
};
