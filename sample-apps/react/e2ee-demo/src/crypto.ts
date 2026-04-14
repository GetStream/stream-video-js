/** Generate a random 16-byte AES-128 key. */
export const generateKey = (): ArrayBuffer => {
  const key = new ArrayBuffer(16);
  crypto.getRandomValues(new Uint8Array(key));
  return key;
};

/** Convert an ArrayBuffer to a hex string. */
export const toHex = (buffer: ArrayBuffer): string =>
  Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

/** Convert a hex string (32 chars) to a 16-byte ArrayBuffer. */
export const fromHex = (hex: string): ArrayBuffer => {
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes.buffer;
};

/** Check if a string is valid 32-character hex. */
export const isValidHex = (value: string): boolean =>
  /^[0-9a-fA-F]{32}$/.test(value);

/**
 * Derive a 16-byte AES-128 key from an arbitrary passphrase using PBKDF2.
 */
export const deriveKeyFromPassphrase = async (
  passphrase: string,
): Promise<ArrayBuffer> => {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: enc.encode('stream-e2ee'),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    baseKey,
    128,
  );
};

/**
 * Parse user input as either a hex key or a passphrase.
 * - If 32-char hex: convert directly to 16 bytes
 * - Otherwise: derive via PBKDF2
 */
export const parseKeyInput = async (input: string): Promise<ArrayBuffer> => {
  if (isValidHex(input)) {
    return fromHex(input);
  }
  return deriveKeyFromPassphrase(input);
};
