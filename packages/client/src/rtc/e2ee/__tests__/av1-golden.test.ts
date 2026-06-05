import { describe, expect, it } from 'vitest';
import { encryptAv1Frame } from '../e2ee-worker/av1';
import { OBU_FRAME, writeLeb128 } from '../e2ee-worker/av1-obu';

const toHex = (b: Uint8Array) =>
  Array.from(b)
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');

describe('AV1 E2EE golden vectors (cross-SDK contract)', () => {
  it('produces stable encrypted bytes for a fixed input', async () => {
    const key = await crypto.subtle.importKey(
      'raw',
      new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]),
      { name: 'AES-GCM', length: 128 },
      false,
      ['encrypt'],
    );
    const ivPrefix = new Uint8Array([1, 1, 1, 1, 1, 1, 1, 1]);
    const td = [(2 << 3) | 0x02, 0x00];
    const codedPayload = [0xde, 0xad, 0xbe, 0xef, 0x01, 0x02];
    const codedHeader = (OBU_FRAME << 3) | 0x04 | 0x02;
    const ext = (0 << 5) | (0 << 3);
    const frame = new Uint8Array([
      ...td,
      codedHeader,
      ext,
      ...Array.from(writeLeb128(codedPayload.length)),
      ...codedPayload,
    ]);

    const enc = await encryptAv1Frame(frame, key, 0, ivPrefix, 1);
    expect(enc).not.toBeNull();
    // Snapshot the hex. On first run vitest writes it; thereafter it is the
    // reference iOS/Android must reproduce byte-for-byte. Update only with a
    // deliberate wire-format change (and bump AV1_VERSION).
    expect(toHex(enc!)).toMatchSnapshot();
  });
});
