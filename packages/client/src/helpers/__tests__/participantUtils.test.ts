import { describe, expect, it } from 'vitest';
import {
  hasAudio,
  hasPausedTrack,
  hasScreenShare,
  hasScreenShareAudio,
  hasVideo,
  isPinned,
} from '../participantUtils';
import { TrackType } from '../../gen/video/sfu/models/models';
import type { StreamVideoParticipant } from '../../types';

describe('participantUtils', () => {
  const createMockParticipant = (
    options?: Partial<StreamVideoParticipant>,
  ): StreamVideoParticipant => {
    return {
      publishedTracks: [],
      pausedTracks: [],
      pin: undefined,
      // Add other required properties for StreamVideoParticipant
      userId: 'test-user',
      sessionId: 'test-session',
      name: 'Test User',
      ...options,
    } as StreamVideoParticipant;
  };

  describe('hasVideo', () => {
    it('should return true when participant has VIDEO track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.VIDEO],
      });
      expect(hasVideo(participant)).toBe(true);
    });

    it('should return false when participant does not have VIDEO track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.AUDIO],
      });
      expect(hasVideo(participant)).toBe(false);
    });
  });

  describe('hasAudio', () => {
    it('should return true when participant has AUDIO track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.AUDIO],
      });
      expect(hasAudio(participant)).toBe(true);
    });

    it('should return false when participant does not have AUDIO track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.VIDEO],
      });
      expect(hasAudio(participant)).toBe(false);
    });
  });

  describe('hasScreenShare', () => {
    it('should return true when participant has SCREEN_SHARE track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.SCREEN_SHARE],
      });
      expect(hasScreenShare(participant)).toBe(true);
    });

    it('should return false when participant does not have SCREEN_SHARE track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.VIDEO],
      });
      expect(hasScreenShare(participant)).toBe(false);
    });
  });

  describe('hasScreenShareAudio', () => {
    it('should return true when participant has SCREEN_SHARE_AUDIO track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.SCREEN_SHARE_AUDIO],
      });
      expect(hasScreenShareAudio(participant)).toBe(true);
    });

    it('should return false when participant does not have SCREEN_SHARE_AUDIO track', () => {
      const participant = createMockParticipant({
        publishedTracks: [TrackType.AUDIO],
      });
      expect(hasScreenShareAudio(participant)).toBe(false);
    });
  });

  describe('isPinned', () => {
    it('should return true when participant has local pin', () => {
      const participant = createMockParticipant({
        pin: { isLocalPin: true, pinnedAt: 0 },
      });
      expect(isPinned(participant)).toBe(true);
    });

    it('should return true when participant has pinnedAt > 0', () => {
      const participant = createMockParticipant({
        pin: { isLocalPin: false, pinnedAt: 123 },
      });
      expect(isPinned(participant)).toBe(true);
    });

    it('should return false when participant has no pin', () => {
      const participant = createMockParticipant({
        pin: undefined,
      });
      expect(isPinned(participant)).toBe(false);
    });

    it('should return false when participant has pinnedAt = 0 and no local pin', () => {
      const participant = createMockParticipant({
        pin: { isLocalPin: false, pinnedAt: 0 },
      });
      expect(isPinned(participant)).toBe(false);
    });
  });

  describe('hasPausedTrack', () => {
    it('should return true when participant has paused VIDEO track', () => {
      const participant = createMockParticipant({
        pausedTracks: [TrackType.VIDEO],
      });
      expect(hasPausedTrack(participant, 'videoTrack')).toBe(true);
    });

    it('should return true when participant has paused SCREEN_SHARE track', () => {
      const participant = createMockParticipant({
        pausedTracks: [TrackType.SCREEN_SHARE],
      });
      expect(hasPausedTrack(participant, 'screenShareTrack')).toBe(true);
    });

    it('should return false when participant has no paused tracks', () => {
      const participant = createMockParticipant({
        pausedTracks: [],
      });
      expect(hasPausedTrack(participant, 'videoTrack')).toBe(false);
    });

    it('should return false when pausedTracks is undefined', () => {
      const participant = createMockParticipant({
        pausedTracks: undefined,
      });
      expect(hasPausedTrack(participant, 'videoTrack')).toBe(false);
    });

    it('should return false when videoTrackType is not recognized', () => {
      const participant = createMockParticipant({
        pausedTracks: [TrackType.VIDEO, TrackType.SCREEN_SHARE],
      });
      // Using any to test an invalid track type
      expect(hasPausedTrack(participant, 'invalidTrack' as any)).toBe(false);
    });

    it('should return false when the specific track type is not paused', () => {
      const participant = createMockParticipant({
        pausedTracks: [TrackType.AUDIO],
      });
      expect(hasPausedTrack(participant, 'videoTrack')).toBe(false);
    });
  });
});
