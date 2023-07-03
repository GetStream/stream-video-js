import type { StreamVideoParticipant } from '@stream-io/video-client';
import { SfuModels } from '@stream-io/video-client';

const trackMock = {
  getSettings: jest.fn(() => ({ deviceId: '123' })),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockParticipant = (
  customFields?: Partial<StreamVideoParticipant>,
): StreamVideoParticipant => ({
  audioLevel: 3,
  connectionQuality: 3,
  isDominantSpeaker: false,
  isSpeaking: false,
  publishedTracks: [SfuModels.TrackType.VIDEO],
  videoStream: {
    toURL: () => 'video-test-url',
    getVideoTracks: jest.fn(() => [trackMock]),
  },
  audioStream: {
    toURL: () => 'audio-test-url',
    getAudioTracks: jest.fn(() => [trackMock]),
  },
  roles: [],
  sessionId: '789-012',
  trackLookupPrefix: '',
  userId: '123-456',
  image: 'https://i.imgur.com/0y8Ftya.jpg',
  name: 'Testy van der Test',
  ...customFields,
});

export default mockParticipant;
