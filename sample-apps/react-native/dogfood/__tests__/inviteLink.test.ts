import { getInviteUrl } from '../src/utils/inviteLink';

it.each([
  ['pronto', 'https://pronto.getstream.io/join/call-123'],
  ['pronto-staging', 'https://pronto-staging.getstream.io/join/call-123'],
  ['demo', 'https://getstream.io/video/demos/join/call-123'],
] as const)('links a %s call without a key', (environment, url) => {
  expect(getInviteUrl(environment, 'call-123')).toBe(url);
});

it('carries the shared key, encoded, so the invitee can decrypt', () => {
  expect(getInviteUrl('pronto', 'call-123', 'amber+otter canyon')).toBe(
    'https://pronto.getstream.io/join/call-123?encryption_key=amber%2Botter%20canyon',
  );
});
