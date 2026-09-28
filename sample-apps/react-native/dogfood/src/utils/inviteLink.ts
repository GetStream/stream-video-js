/**
 * The web join link for a call, carrying the shared E2EE key when there is one
 * so that the invitee's lobby can decrypt without typing it in. Opens in the
 * react-dogfood app, or in this app through its deep link handler.
 */
export const getInviteUrl = (
  environment: AppEnvironment,
  callId: string,
  encryptionKey?: string,
): string => {
  const base =
    environment === 'pronto'
      ? 'https://pronto.getstream.io/join/'
      : environment === 'pronto-staging'
        ? 'https://pronto-staging.getstream.io/join/'
        : 'https://getstream.io/video/demos/join/';
  // Built by hand: React Native's URL does not implement searchParams setters.
  const query = encryptionKey
    ? `?encryption_key=${encodeURIComponent(encryptionKey)}`
    : '';
  return `${base}${callId}${query}`;
};
