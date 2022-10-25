import { SfuEvent } from '@stream-io/video-client/dist/src/gen/video/sfu/event/events';
import { PeerType } from '@stream-io/video-client/src/gen/video/sfu/models/models';
import { Call } from './Call';

export const registerEventHandlers = (call: Call) => {
  watchForPublishQualityChangeEvents(call);
};

const watchForPublishQualityChangeEvents = (call: Call) => {
  call.on('changePublishQuality', (event: SfuEvent) => {
    if (event.eventPayload.oneofKind === 'changePublishQuality') {
      const videoSenders =
        event.eventPayload.changePublishQuality?.videoSenders;
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

export const handleICETrickle = (call: Call) => async (e: SfuEvent) => {
  if (e.eventPayload.oneofKind !== 'iceTrickle') {
    return;
  }
  const { iceTrickle } = e.eventPayload;

  const candidate = JSON.parse(iceTrickle.iceCandidate);
  if (iceTrickle.peerType === PeerType.SUBSCRIBER) {
    if (call.subscriber?.remoteDescription) {
      await call.subscriber?.addIceCandidate(candidate);
    } else {
      call.subscriberCandidates.push(candidate);
    }

    // enqueue ICE candidate if remote description is not set yet
    //https://stackoverflow.com/questions/38198751/domexception-error-processing-ice-candidate
  } else if (iceTrickle.peerType === PeerType.PUBLISHER_UNSPECIFIED) {
    if (call.publisher?.remoteDescription) {
      await call.publisher.addIceCandidate(candidate);
    } else {
      call.publisherCandidates.push(candidate);
    }
  } else {
    console.warn('ICETrickle, unknown peer type', iceTrickle);
  }
};
