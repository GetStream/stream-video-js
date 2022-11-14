import type {
  Participant,
  VideoDimension,
} from '../gen/video/sfu/models/models';

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

export type SubscriptionChange = {
  /**
   * The video dimension to request.
   * Set it to `undefined` in case you want to unsubscribe.
   */
  videoDimension: VideoDimension | undefined;
};

export type SubscriptionChanges = {
  [sessionId: string]: SubscriptionChange;
};
