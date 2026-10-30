import type { User } from '../types/user';

const decodeBase64 = (value: string): string => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    '=',
  );
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

export const getUserFromToken = (token?: string): User | null => {
  if (!token) return null;
  const fragments = token.split('.');
  if (fragments.length !== 3) {
    return null;
  }
  try {
    // only the user fields: the rest of the payload (iat, exp, ...) is not user data
    const { user_id, name, image } = JSON.parse(decodeBase64(fragments[1]));
    return { id: user_id, name, image };
  } catch {
    return null;
  }
};
