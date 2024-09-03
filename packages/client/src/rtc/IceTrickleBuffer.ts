import { ReplaySubject } from 'rxjs';
import { ICETrickle } from '../gen/video/sfu/event/events';
import { PeerType } from '../gen/video/sfu/models/models';
import { getLogger } from '../logger';

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
      const logger = getLogger(['sfu-client']);
      logger('warn', `ICETrickle, Unknown peer type`, iceTrickle);
    }
  };
}
