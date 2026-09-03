import { describe, expect, it } from 'vitest';
import { IceTrickleBuffer } from '../IceTrickleBuffer';
import { PeerType } from '../../gen/video/sfu/models/models';

// The generation is carried via `usernameFragment` (the key getCandidateUfrag
// reads); the candidate-string `ufrag` token path has its own helper tests.
const trickle = (
  ufrag: string | undefined,
  candidate: string,
  peerType = PeerType.SUBSCRIBER,
) => ({
  peerType,
  iceCandidate: JSON.stringify(
    ufrag ? { usernameFragment: ufrag, candidate } : { candidate },
  ),
});

const sdp = (ufrag: string) =>
  `v=0\r\na=ice-ufrag:${ufrag}\r\na=ice-pwd:pwd\r\n`;

const collect = (
  observable: IceTrickleBuffer['subscriber']['candidates'],
): RTCIceCandidateInit[] => {
  const seen: RTCIceCandidateInit[] = [];
  observable.subscribe((c) => seen.push(c)).unsubscribe();
  return seen;
};

describe('IceTrickleBuffer', () => {
  it('emits buffered candidates of the active generation to a new subscriber', () => {
    const buffer = new IceTrickleBuffer();
    buffer.push(trickle('u1', 'a'));
    buffer.push(trickle('u1', 'b'));
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u1'));

    expect(collect(buffer.subscriber.candidates)).toEqual([
      { usernameFragment: 'u1', candidate: 'a' },
      { usernameFragment: 'u1', candidate: 'b' },
    ]);
  });

  it('emits live candidates of the active generation', () => {
    const buffer = new IceTrickleBuffer();
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u1'));
    const seen: RTCIceCandidateInit[] = [];
    buffer.subscriber.candidates.subscribe((c) => seen.push(c));

    buffer.push(trickle('u1', 'a'));

    expect(seen).toEqual([{ usernameFragment: 'u1', candidate: 'a' }]);
  });

  it('drops superseded-generation candidates once the generation advances', () => {
    const buffer = new IceTrickleBuffer();
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u0'));
    buffer.push(trickle('u0', 'old'));

    // ICE restart -> new generation
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u1'));
    buffer.push(trickle('u1', 'new'));

    expect(collect(buffer.subscriber.candidates)).toEqual([
      { usernameFragment: 'u1', candidate: 'new' },
    ]);
  });

  it('holds future-generation candidates until their generation becomes active', () => {
    const buffer = new IceTrickleBuffer();
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u1'));
    // a candidate for a not-yet-applied generation arrives early (trickle race)
    buffer.push(trickle('u2', 'future'));

    expect(collect(buffer.subscriber.candidates)).toEqual([]);

    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u2'));

    expect(collect(buffer.subscriber.candidates)).toEqual([
      { usernameFragment: 'u2', candidate: 'future' },
    ]);
  });

  it('emits candidates without a generation marker (fail-open)', () => {
    const buffer = new IceTrickleBuffer();
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u1'));
    buffer.push(trickle(undefined, 'no-generation'));

    expect(collect(buffer.subscriber.candidates)).toEqual([
      { candidate: 'no-generation' },
    ]);
  });

  it('emits all candidates when no active generation is set (fail-open)', () => {
    const buffer = new IceTrickleBuffer();
    buffer.push(trickle('u1', 'a'));
    buffer.push(trickle('u2', 'b'));

    expect(collect(buffer.subscriber.candidates)).toEqual([
      { usernameFragment: 'u1', candidate: 'a' },
      { usernameFragment: 'u2', candidate: 'b' },
    ]);
  });

  it('keeps subscriber and publisher generations independent', () => {
    const buffer = new IceTrickleBuffer();
    buffer.push(trickle('u1', 'sub', PeerType.SUBSCRIBER));
    buffer.push(trickle('p1', 'pub', PeerType.PUBLISHER_UNSPECIFIED));
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u1'));
    buffer.updateActiveGeneration(PeerType.PUBLISHER_UNSPECIFIED, sdp('p1'));

    expect(collect(buffer.subscriber.candidates)).toEqual([
      { usernameFragment: 'u1', candidate: 'sub' },
    ]);
    expect(collect(buffer.publisher.candidates)).toEqual([
      { usernameFragment: 'p1', candidate: 'pub' },
    ]);
  });

  it('dispose clears retained candidates', () => {
    const buffer = new IceTrickleBuffer();
    buffer.updateActiveGeneration(PeerType.SUBSCRIBER, sdp('u1'));
    buffer.push(trickle('u1', 'a'));

    buffer.dispose();

    expect(collect(buffer.subscriber.candidates)).toEqual([]);
  });
});
