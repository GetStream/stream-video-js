// based on: https://stateful.com/blog/key-generation-webcrypto
export class JwtTokenGenerator {
  private readonly key: Promise<CryptoKey>;

  constructor(secret: string) {
    this.key = crypto.subtle.importKey(
      'raw',
      // @ts-expect-error - types changed in TS 5.9.3
      stringToUint8Array(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
  }

  generate = async (tokenPayload: Record<string, any>): Promise<string> => {
    // -2000 for potential clock skew
    const nowInSeconds = Math.floor(Date.now() / 1000) - 2000;
    const oneDayFromNow = nowInSeconds + 60 * 60 * 24;

    const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
    const payload = JSON.stringify({
      iss: '@pronto',
      iat: nowInSeconds,
      exp: oneDayFromNow,
      ...tokenPayload,
    });

    const headerBase64 = uint8ArrayToString(stringToUint8Array(header));
    const payloadBase64 = uint8ArrayToString(stringToUint8Array(payload));
    const headerAndPayload = `${headerBase64}.${payloadBase64}`;

    const signature = await crypto.subtle.sign(
      { name: 'HMAC', hash: 'SHA-256' },
      await this.key,
      // @ts-expect-error - types changed in TS 5.9.3
      stringToUint8Array(headerAndPayload),
    );

    const base64Signature = uint8ArrayToString(new Uint8Array(signature));
    return `${headerAndPayload}.${base64Signature}`;
  };
}

function base64ToUint8Array(base64Contents: string): Uint8Array {
  base64Contents = base64Contents
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/\s/g, '');
  const content = atob(base64Contents);
  return new Uint8Array(content.split('').map((c) => c.charCodeAt(0)));
}

function stringToUint8Array(contents: string): Uint8Array {
  const encoded = btoa(unescape(encodeURIComponent(contents)));
  return base64ToUint8Array(encoded);
}

function uint8ArrayToString(unsignedArray: Uint8Array): string {
  const base64string = btoa(String.fromCharCode(...unsignedArray));
  return base64string.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}
