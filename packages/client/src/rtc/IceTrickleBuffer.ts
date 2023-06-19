import { ReplaySubject } from 'rxjs';
import { ICETrickle, PeerType } from '../gen/video/sfu/models/models';
import { getLogger } from '../logger';
import { Logger } from '../coordinator/connection/types';

/**
 * A buffer for ICE Candidates. Used for ICE Trickle:
 * - https://bloggeek.me/webrtcglossary/trickle-ice/
 */
export class IceTrickleBuffer {
  readonly subscriberCandidates = new ReplaySubject<ICETrickle>();
  readonly publisherCandidates = new ReplaySubject<ICETrickle>();
  private logger?: Logger;

  constructor() {
    this.logger = getLogger(['sfu-client']);
  }

  push = (iceTrickle: ICETrickle) => {
    if (iceTrickle.peerType === PeerType.SUBSCRIBER) {
      this.subscriberCandidates.next(iceTrickle);
    } else if (iceTrickle.peerType === PeerType.PUBLISHER_UNSPECIFIED) {
      this.publisherCandidates.next(iceTrickle);
    } else {
      this.logger?.('warn', `ICETrickle, Unknown peer type`, iceTrickle);
    }
  };
}
