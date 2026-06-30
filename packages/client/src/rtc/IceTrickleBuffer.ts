import { Observable, Subject } from 'rxjs';
import { ICETrickle } from '../gen/video/sfu/event/events';
import { PeerType } from '../gen/video/sfu/models/models';
import { videoLoggerSystem } from '../logger';
import { getCandidateUfrag, parseIceUfrag } from './helpers/iceCandiates';
import { ensureExhausted } from '../helpers/ensureExhausted';

/**
 * A buffer for ICE Candidates. Used for ICE Trickle:
 * - https://bloggeek.me/webrtcglossary/trickle-ice/
 *
 * The buffer is generation-aware: each peer connection tells it which ICE
 * generation is current via `updateActiveGeneration` (whenever it applies an
 * offer/answer). Candidate streams then emit only candidates of the active
 * generation, hold candidates of a not-yet-applied (future) generation until
 * it becomes active, and drop candidates of a superseded generation so they
 * are never replayed. Candidates with no detectable generation, or before any
 * generation is set, are emitted as-is (fail open).
 */
export class IceTrickleBuffer {
  readonly subscriber = new CandidateGenerationBuffer();
  readonly publisher = new CandidateGenerationBuffer();

  push = (iceTrickle: ICETrickle) => {
    const iceCandidate = toIceCandidate(iceTrickle);
    if (!iceCandidate) return;

    const { peerType } = iceTrickle;
    switch (peerType) {
      case PeerType.SUBSCRIBER:
        this.subscriber.push(iceCandidate);
        break;
      case PeerType.PUBLISHER_UNSPECIFIED:
        this.publisher.push(iceCandidate);
        break;
      default:
        ensureExhausted(peerType, `ICETrickle, Unknown peer type`);
    }
  };

  /**
   * Declares the ICE generation that is now current for the given peer type,
   * derived from the `ice-ufrag` of the just-applied remote description.
   * Candidates of superseded generations are evicted; candidates of the active
   * generation flow to subscribers.
   */
  updateActiveGeneration = (peerType: PeerType, sdp: string | undefined) => {
    const ufrag = parseIceUfrag(sdp);
    switch (peerType) {
      case PeerType.SUBSCRIBER:
        this.subscriber.updateActiveGeneration(ufrag);
        break;
      case PeerType.PUBLISHER_UNSPECIFIED:
        this.publisher.updateActiveGeneration(ufrag);
        break;
      default:
        ensureExhausted(peerType, `updateActiveGeneration, Unknown peer type`);
    }
  };

  dispose = () => {
    this.subscriber.dispose();
    this.publisher.dispose();
  };
}

/**
 * Per-peer-connection generation-aware candidate store. Retains trickled
 * candidates and replays the active generation to each new subscriber, then
 * forwards matching live candidates.
 */
class CandidateGenerationBuffer {
  private readonly store: RTCIceCandidateInit[] = [];
  private readonly live = new Subject<RTCIceCandidateInit>();
  private readonly seenUfrags = new Set<string>();
  private activeUfrag: string | undefined;

  readonly candidates = new Observable<RTCIceCandidateInit>((subscriber) => {
    for (const candidate of this.store.slice()) {
      if (this.isCurrent(candidate)) subscriber.next(candidate);
    }
    const subscription = this.live.subscribe((candidate) => {
      if (this.isCurrent(candidate)) subscriber.next(candidate);
    });
    return () => subscription.unsubscribe();
  });

  push = (candidate: RTCIceCandidateInit) => {
    this.store.push(candidate);
    this.live.next(candidate);
  };

  updateActiveGeneration = (ufrag: string | undefined) => {
    if (ufrag) this.seenUfrags.add(ufrag);
    this.activeUfrag = ufrag;
    // evict candidates from superseded generations (a generation we have
    // applied before but is no longer current); keep future generations.
    for (let i = this.store.length - 1; i >= 0; i--) {
      const candidateUfrag = getCandidateUfrag(this.store[i]);
      if (
        candidateUfrag &&
        candidateUfrag !== this.activeUfrag &&
        this.seenUfrags.has(candidateUfrag)
      ) {
        this.store.splice(i, 1);
      }
    }
  };

  dispose = () => {
    this.store.length = 0;
    this.live.complete();
  };

  /**
   * A candidate belongs to the current generation when its ufrag matches the
   * active one. Fail open when either the candidate's generation or the active
   * generation is unknown, so untagged candidates are never withheld.
   */
  private isCurrent = (candidate: RTCIceCandidateInit): boolean => {
    const candidateUfrag = getCandidateUfrag(candidate);
    if (!candidateUfrag || !this.activeUfrag) return true;
    return candidateUfrag === this.activeUfrag;
  };
}

const toIceCandidate = (
  iceTrickle: ICETrickle,
): RTCIceCandidateInit | undefined => {
  try {
    return JSON.parse(iceTrickle.iceCandidate);
  } catch (e) {
    const logger = videoLoggerSystem.getLogger('sfu-client');
    logger.error(`Failed to parse ICE Trickle`, e, iceTrickle);
    return undefined;
  }
};
