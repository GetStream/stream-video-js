// stays far below the argument count limit of every supported JS engine
const MAX_CHUNK_LENGTH = 0x1000;

const malformed = (offset: number) =>
  new TypeError(`The encoded data was not valid UTF-8 (byte ${offset})`);

/**
 * Decodes UTF-8 the way `new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })`
 * does: malformed input throws a `TypeError` and a leading BOM is preserved.
 *
 * @param bytes the UTF-8 encoded data.
 */
export const decodeUtf8 = (bytes?: Uint8Array): string => {
  if (!bytes) return '';
  const length = bytes.length;
  const units: number[] = [];
  let result = '';
  let i = 0;
  while (i < length) {
    const start = i;
    // in bounds, guarded by the loop condition
    const b0 = bytes[i++] as number;
    if (b0 < 0x80) {
      units.push(b0);
    } else if (b0 >= 0xc2 && b0 <= 0xdf) {
      // reading past the end yields `undefined` despite the cast,
      // which fails the continuation byte checks below
      const b1 = bytes[i++] as number;
      if ((b1 & 0xc0) !== 0x80) throw malformed(start);
      units.push(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if (b0 >= 0xe0 && b0 <= 0xef) {
      const b1 = bytes[i++] as number;
      const b2 = bytes[i++] as number;
      if ((b1 & 0xc0) !== 0x80 || (b2 & 0xc0) !== 0x80) throw malformed(start);
      const codePoint = ((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f);
      // overlong encodings and UTF-16 surrogates
      if (codePoint < 0x800 || (codePoint >= 0xd800 && codePoint <= 0xdfff)) {
        throw malformed(start);
      }
      units.push(codePoint);
    } else if (b0 >= 0xf0 && b0 <= 0xf4) {
      const b1 = bytes[i++] as number;
      const b2 = bytes[i++] as number;
      const b3 = bytes[i++] as number;
      if (
        (b1 & 0xc0) !== 0x80 ||
        (b2 & 0xc0) !== 0x80 ||
        (b3 & 0xc0) !== 0x80
      ) {
        throw malformed(start);
      }
      const codePoint =
        ((b0 & 0x07) << 18) |
        ((b1 & 0x3f) << 12) |
        ((b2 & 0x3f) << 6) |
        (b3 & 0x3f);
      // overlong encodings and values beyond the Unicode range
      if (codePoint < 0x10000 || codePoint > 0x10ffff) throw malformed(start);
      const offset = codePoint - 0x10000;
      units.push(0xd800 + (offset >> 10), 0xdc00 + (offset & 0x3ff));
    } else {
      // lone continuation bytes, 0xc0, 0xc1 and 0xf5..0xff
      throw malformed(start);
    }

    if (units.length >= MAX_CHUNK_LENGTH) {
      result += String.fromCharCode.apply(null, units);
      units.length = 0;
    }
  }
  return units.length > 0
    ? result + String.fromCharCode.apply(null, units)
    : result;
};

/**
 * Handed to the video client to decode the strings of the SFU protobuf events
 * on runtimes that have no `TextDecoder` (Hermes before React Native 0.88).
 */
export const utf8TextDecoder = { decode: decodeUtf8 };
