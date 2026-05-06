type JwtPayload = { user_id?: string };

const decodeJwtPayload = (token: string): JwtPayload | undefined => {
  const parts = token.split('.');
  if (parts.length !== 3) return undefined;
  const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64 + '=='.slice(0, (4 - (b64.length % 4)) % 4);
  try {
    const json =
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as JwtPayload;
  } catch {
    return undefined;
  }
};

export const getUserFromToken = (token: string): string =>
  decodeJwtPayload(token)?.user_id ?? '';
