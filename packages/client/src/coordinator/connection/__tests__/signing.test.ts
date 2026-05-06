import { describe, expect, it } from 'vitest';
import { getUserFromToken } from '../signing';

const encodeBase64Url = (input: string): string => {
  const b64 =
    typeof btoa === 'function'
      ? btoa(input)
      : Buffer.from(input, 'utf8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const buildJwt = (payload: object): string => {
  const header = encodeBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = encodeBase64Url(JSON.stringify(payload));
  return `${header}.${body}.signature`;
};

describe('getUserFromToken', () => {
  it('returns "" for malformed (non-3-part) tokens', () => {
    expect(getUserFromToken('a.b')).toBe('');
    expect(getUserFromToken('a')).toBe('');
    expect(getUserFromToken('a.b.c.d')).toBe('');
    expect(getUserFromToken('')).toBe('');
  });

  it('returns "" for tokens whose payload is invalid base64', () => {
    expect(getUserFromToken('header.@@@invalid@@@.sig')).toBe('');
  });

  it('returns "" for tokens whose payload is not valid JSON', () => {
    const notJson = encodeBase64Url('not-json');
    expect(getUserFromToken(`header.${notJson}.sig`)).toBe('');
  });

  it('returns user_id for a valid token', () => {
    const token = buildJwt({ user_id: 'jane', sub: 'jane' });
    expect(getUserFromToken(token)).toBe('jane');
  });

  it('returns "" when payload lacks user_id', () => {
    const token = buildJwt({ sub: 'jane' });
    expect(getUserFromToken(token)).toBe('');
  });

  it('decodes payloads whose base64url contains "_" (legacy decoder bug)', () => {
    // user_id "???" forces the third 6-bit group of one segment to be 63 (= "/" in
    // standard base64, "_" in base64url). The pre-F9 decoder did not recognise "_"
    // and therefore mangled the payload.
    const token = buildJwt({ user_id: '???' });
    const segment = token.split('.')[1];
    expect(segment.includes('_')).toBe(true);
    expect(getUserFromToken(token)).toBe('???');
  });

  it('decodes payloads whose base64url contains "-"', () => {
    // user_id ">>>" forces a 6-bit group of 62 (= "+" in standard base64, "-" in
    // base64url) and exercises the same code path with the other base64url char.
    const token = buildJwt({ user_id: '>>>' });
    const segment = token.split('.')[1];
    expect(segment.includes('-')).toBe(true);
    expect(getUserFromToken(token)).toBe('>>>');
  });
});
