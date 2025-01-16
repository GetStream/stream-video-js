import { ReplaySubject } from 'rxjs';
import { ICETrickle } from '../gen/video/sfu/event/events';
import { PeerType } from '../gen/video/sfu/models/models';
import { getLogger } from '../logger';

/**
 * A buffer for ICE Candidates. Used for ICE Trickle:
 * - https://bloggeek.me/webrtcglossary/trickle-ice/
 */
export class IceTrickleBuffer {
  readonly subscriberCandidates = new ReplaySubject<RTCIceCandidateInit>();
  readonly publisherCandidates = new ReplaySubject<RTCIceCandidateInit>();

  push = (iceTrickle: ICETrickle) => {
    const iceCandidate = toIceCandidate(iceTrickle);
    if (!iceCandidate) return;

    if (iceTrickle.peerType === PeerType.SUBSCRIBER) {
      this.subscriberCandidates.next(iceCandidate);
    } else if (iceTrickle.peerType === PeerType.PUBLISHER_UNSPECIFIED) {
      this.publisherCandidates.next(iceCandidate);
    } else {
      const logger = getLogger(['sfu-client']);
      logger('warn', `ICETrickle, Unknown peer type`, iceTrickle);
    }
  };

  dispose = () => {
    this.subscriberCandidates.complete();
    this.publisherCandidates.complete();
  };
}

const toIceCandidate = (
  iceTrickle: ICETrickle,
): RTCIceCandidateInit | undefined => {
  try {
    return JSON.parse(iceTrickle.iceCandidate);
  } catch (e) {
    const logger = getLogger(['sfu-client']);
    logger('error', `Failed to parse ICE Trickle`, e, iceTrickle);
    return undefined;
  }
};
