import { decodeBase64, encodeBase64 } from './base64';

/**
 *
 * @param {string} userId the id of the user
 * @return {string}
 */
export function DevToken(userId: string) {
  return [
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', //{"alg": "HS256", "typ": "JWT"}
    encodeBase64(JSON.stringify({ user_id: userId })),
    'devtoken', // hardcoded signature
  ].join('.');
}

export function UserFromToken(token: string) {
  const fragments = token.split('.');
  if (fragments.length !== 3) {
    return '';
  }
  const b64Payload = fragments[1];
  const payload = decodeBase64(b64Payload);
  const data = JSON.parse(payload);
  return data.user_id as string;
}
