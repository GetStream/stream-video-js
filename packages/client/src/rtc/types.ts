import { Participant, VideoDimension } from '../gen/video/sfu/models/models';

export type StreamVideoParticipant = {
  videoTrack?: MediaStream;
  audioTrack?: MediaStream;
  videoDimension?: VideoDimension;
  isLoggedInUser?: boolean;

  /**
   * Audio level of the current participant [0 - silence, 1 - loudest].
   */
  audioLevel?: number;
  /**
   * True when SDK defined audio-level threshold is exceeded.
   */
  isSpeaking?: boolean;
} & Participant;

export type VideoDimensionChange = {
  participant: StreamVideoParticipant;
  videoDimension: VideoDimension;
};
