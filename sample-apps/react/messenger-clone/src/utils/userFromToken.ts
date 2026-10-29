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
  const b64Payload = fragments[1];
  const payload = decodeBase64(b64Payload);
  const { user_id, ...userData } = JSON.parse(payload);

  return {
    ...userData,
    id: user_id,
  };
};
