import { StreamVideoParticipant } from '../types';
import { TrackType } from '../gen/video/sfu/models/models';

/**
 * Check if a participant has a video.
 *
 * @param p the participant to check.
 */
export const hasVideo = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.VIDEO);

/**
 * Check if a participant has audio.
 *
 * @param p the participant to check.
 */
export const hasAudio = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.AUDIO);

/**
 * Check if a participant is screen sharing.
 *
 * @param p the participant to check.
 */
export const hasScreenShare = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.SCREEN_SHARE);

/**
 * Check if a participant is screen sharing audio.
 *
 * @param p the participant to check.
 */
export const hasScreenShareAudio = (p: StreamVideoParticipant) =>
  p.publishedTracks.includes(TrackType.SCREEN_SHARE_AUDIO);
