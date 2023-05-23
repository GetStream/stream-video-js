import type { StreamVideoParticipant } from '@stream-io/video-client';

const mockParticipant = (
  customFields?: Partial<StreamVideoParticipant>,
): StreamVideoParticipant => ({
  audioLevel: 3,
  connectionQuality: 3,
  isDominantSpeaker: false,
  isSpeaking: false,
  publishedTracks: [],
  roles: [],
  sessionId: '789-012',
  trackLookupPrefix: '',
  userId: '123-456',
  image: 'https://i.imgur.com/0y8Ftya.jpg',
  name: 'Testy van der Test',
  ...customFields,
});

export default mockParticipant;
