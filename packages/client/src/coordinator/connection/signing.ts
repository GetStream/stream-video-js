type JwtPayload = { user_id?: string };

const BASE64_ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Self-contained standard-base64 decoder. Returns a Latin1-style binary string
 * (one byte per output character), mirroring `atob`'s contract. Used because:
 *
 * - `atob` is a Hermes built-in only since React Native 0.74; users on the
 *   project's peer-dep floor (RN 0.73) do not have it.
 * - `Buffer` is not shipped by React Native at all.
 *
 * Returning a self-contained decoder keeps the decoder's behaviour identical
 * across Node, browsers, and React Native without requiring a polyfill.
 *
 * The input must already be standard base64 (the `-`/`_` to `+`/`/`
 * normalisation happens in the caller). Padding is tolerated but not required.
 * Invalid characters are skipped, matching `atob`'s lenient behaviour.
 */
const decodeStandardBase64 = (input: string): string => {
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charAt(i);
    if (ch === '=') break;
    const value = BASE64_ALPHABET.indexOf(ch);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
};

const decodeJwtPayload = (token: string): JwtPayload | undefined => {
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  try {
    const json = decodeStandardBase64(normalized);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return undefined;
  }
};

export const getUserFromToken = (token: string): string =>
  decodeJwtPayload(token)?.user_id ?? '';
