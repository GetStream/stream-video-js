import { ReplaySubject } from 'rxjs';
import { ICETrickle, PeerType } from '../gen/video/sfu/models/models';

/**
 * A buffer for ICE Candidates. Used for ICE Trickle:
 * - https://bloggeek.me/webrtcglossary/trickle-ice/
 */
export class IceTrickleBuffer {
  readonly subscriberCandidates = new ReplaySubject<ICETrickle>();
  readonly publisherCandidates = new ReplaySubject<ICETrickle>();

  push = (iceTrickle: ICETrickle) => {
    if (iceTrickle.peerType === PeerType.SUBSCRIBER) {
      this.subscriberCandidates.next(iceTrickle);
    } else if (iceTrickle.peerType === PeerType.PUBLISHER_UNSPECIFIED) {
      this.publisherCandidates.next(iceTrickle);
    } else {
      console.warn(`ICETrickle, Unknown peer type`, iceTrickle);
    }
  };
}
