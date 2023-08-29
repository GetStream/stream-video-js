import {
  ConnectionQuality,
  TrackType,
} from '../../gen/video/sfu/models/models';
import { StreamVideoParticipant, VisibilityState } from '../../types';

export const participants = (): StreamVideoParticipant[] => [
  {
    // Video, audio
    name: 'A',
    userId: '1',
    sessionId: '1',
    publishedTracks: [TrackType.AUDIO, TrackType.VIDEO],
    trackLookupPrefix: '123',
    connectionQuality: ConnectionQuality.EXCELLENT,
    isSpeaking: false,
    isDominantSpeaker: false,
    audioLevel: 0,
    image: '',
    roles: [],
    viewportVisibilityState: {
      videoTrack: VisibilityState.VISIBLE,
      screenShareTrack: VisibilityState.VISIBLE,
    },
  },
  {
    // Presenter, video, audio
    name: 'B',
    userId: '2',
    sessionId: '2',
    publishedTracks: [TrackType.AUDIO, TrackType.VIDEO, TrackType.SCREEN_SHARE],
    trackLookupPrefix: '123',
    connectionQuality: ConnectionQuality.EXCELLENT,
    isSpeaking: false,
    isDominantSpeaker: false,
    audioLevel: 0,
    image: '',
    roles: [],
    viewportVisibilityState: {
      videoTrack: VisibilityState.VISIBLE,
      screenShareTrack: VisibilityState.VISIBLE,
    },
  },
  {
    // Muted
    name: 'C',
    userId: '3',
    sessionId: '3',
    publishedTracks: [],
    trackLookupPrefix: '123',
    connectionQuality: ConnectionQuality.EXCELLENT,
    isSpeaking: false,
    isDominantSpeaker: false,
    audioLevel: 0,
    image: '',
    roles: [],
    viewportVisibilityState: {
      videoTrack: VisibilityState.VISIBLE,
      screenShareTrack: VisibilityState.VISIBLE,
    },
  },
  {
    // Dominant speaker
    name: 'D',
    userId: '4',
    sessionId: '4',
    publishedTracks: [TrackType.AUDIO],
    trackLookupPrefix: '123',
    connectionQuality: ConnectionQuality.EXCELLENT,
    isSpeaking: false,
    isDominantSpeaker: true,
    audioLevel: 0,
    image: '',
    roles: [],
    viewportVisibilityState: {
      videoTrack: VisibilityState.VISIBLE,
      screenShareTrack: VisibilityState.VISIBLE,
    },
  },
  {
    // Presenter only
    name: 'E',
    userId: '5',
    sessionId: '5',
    publishedTracks: [TrackType.SCREEN_SHARE],
    trackLookupPrefix: '123',
    connectionQuality: ConnectionQuality.EXCELLENT,
    isSpeaking: false,
    isDominantSpeaker: false,
    audioLevel: 0,
    image: '',
    roles: [],
    viewportVisibilityState: {
      videoTrack: VisibilityState.VISIBLE,
      screenShareTrack: VisibilityState.VISIBLE,
    },
  },
  {
    // pinned
    name: 'F',
    userId: '6',
    sessionId: '6',
    publishedTracks: [TrackType.AUDIO, TrackType.VIDEO],
    trackLookupPrefix: '123',
    connectionQuality: ConnectionQuality.EXCELLENT,
    isSpeaking: false,
    isDominantSpeaker: false,
    audioLevel: 0,
    image: '',
    pin: {
      isLocalPin: true,
      pinnedAt: Date.now(),
    },
    roles: [],
    viewportVisibilityState: {
      videoTrack: VisibilityState.VISIBLE,
      screenShareTrack: VisibilityState.VISIBLE,
    },
  },
];
