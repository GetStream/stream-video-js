import { describe, expect, it } from 'vitest';
import type { E2EEManager } from '../E2EEManager';

/**
 * `Call.setE2EEManager` accepts any {@link E2EEManager}, so a third party can
 * plug in another scheme (RFC 9605 SFrame, say) instead of the built-in one.
 *
 * That contract is a compile-time property, so the assertion that matters here
 * is the type annotation below, not the expectations in the test body: adding a
 * required member to the interface breaks the build in this file, which is the
 * signal worth raising, since it is a breaking change for implementors.
 */
const attached: string[] = [];

const customImplementation: E2EEManager = {
  // Parameters are contextually typed from the annotation, so a signature the
  // interface does not describe fails to compile.
  encrypt: (sender, codec, trackType) => {
    attached.push(`encode:${sender.track?.kind}:${codec}:${trackType}`);
  },
  decrypt: (receiver, userId, trackType) => {
    attached.push(`decode:${receiver.track?.kind}:${userId}:${trackType}`);
  },
};

describe('E2EEManager contract', () => {
  it('is satisfied by an implementation providing only encrypt and decrypt', () => {
    const sender = { track: { kind: 'video' } } as RTCRtpSender;
    const receiver = { track: { kind: 'audio' } } as RTCRtpReceiver;

    customImplementation.encrypt(sender, 'vp8', 'VIDEO');
    customImplementation.decrypt(receiver, 'bob', 'AUDIO');

    expect(attached).toEqual([
      'encode:video:vp8:VIDEO',
      'decode:audio:bob:AUDIO',
    ]);
  });
});
