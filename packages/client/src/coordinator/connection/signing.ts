export function getUserFromToken(token: string) {
  const fragments = token.split('.');
  if (fragments.length !== 3) {
    return '';
  }
  const b64Payload = fragments[1];
  const payload = decodeBase64(b64Payload);
  const data = JSON.parse(payload);
  return data.user_id as string | undefined;
}

// base-64 decoder throws exception if encoded string is not padded by '=' to make string length
// in multiples of 4. So gonna use our own method for this purpose to keep backwards compatibility
// https://github.com/beatgammit/base64-js/blob/master/index.js#L26
const decodeBase64 = (s: string): string => {
  const e = {} as { [key: string]: number },
    w = String.fromCharCode,
    L = s.length;
  let i,
    b = 0,
    c,
    x,
    l = 0,
    a,
    r = '';
  const A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (i = 0; i < 64; i++) {
    e[A.charAt(i)] = i;
  }
  for (x = 0; x < L; x++) {
    c = e[s.charAt(x)];
    b = (b << 6) + c;
    l += 6;
    while (l >= 8) {
      if ((a = (b >>> (l -= 8)) & 0xff) || x < L - 2) r += w(a);
    }
  }
  return r;
};
