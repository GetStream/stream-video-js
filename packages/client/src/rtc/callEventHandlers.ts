import type { SfuEvent } from '../gen/video/sfu/event/events';
import { Call } from './Call';
import { PeerType } from '../gen/video/sfu/models/models';

export const registerEventHandlers = (call: Call) => {
  watchForPublishQualityChangeEvents(call);
};

const watchForPublishQualityChangeEvents = (call: Call) => {
  call.on('changePublishQuality', (event: SfuEvent) => {
    if (event.eventPayload.oneofKind === 'changePublishQuality') {
      const { videoSenders } = event.eventPayload.changePublishQuality;
      if (videoSenders && videoSenders.length > 0) {
        videoSenders.forEach((videoSender) => {
          const { layers } = videoSender;
          call.updatePublishQuality(
            layers.filter((l) => l.active).map((l) => l.name),
          );
        });
      }
    }
  });
};

export const handleICETrickle =
  (subscriber: RTCPeerConnection, publisher: RTCPeerConnection) =>
  async (e: SfuEvent) => {
    if (e.eventPayload.oneofKind !== 'iceTrickle') return;
    const { iceTrickle } = e.eventPayload;
    const iceCandidate: RTCIceCandidateInit = JSON.parse(
      iceTrickle.iceCandidate,
    );
    if (iceTrickle.peerType === PeerType.SUBSCRIBER) {
      await subscriber.addIceCandidate(iceCandidate);
    } else if (iceTrickle.peerType === PeerType.PUBLISHER_UNSPECIFIED) {
      await publisher.addIceCandidate(iceCandidate);
    } else {
      console.warn(`ICETrickle, unknown peer type`, iceTrickle);
    }
  };
