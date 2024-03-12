import { encodeBase64 } from './base64';

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
