import {
  MediaStateChange,
  MediaStateChangeReason,
} from '../gen/video/coordinator/stat_v1/stat';
import type {
  Participant,
  VideoDimension,
} from '../gen/video/sfu/models/models';

export type StreamVideoParticipant = {
  /**
   * The participant's audio stream, if they are publishing audio and
   * we have subscribed to it.
   */
  audioStream?: MediaStream;

  /**
   * The participant's video stream, if they are sharing their video,
   * and we are subscribed to it.
   */
  videoStream?: MediaStream;

  /**
   * The participant's screen share stream, if they are sharing their screen,
   * and we are subscribed to it.
   */
  screenShareStream?: MediaStream;

  /**
   * The preferred video dimensions for this participant.
   * Set it to null to disable video.
   */
  videoDimension?: VideoDimension;

  /**
   * True if the participant is the local participant.
   */
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

export type StreamVideoLocalParticipant = {
  /**
   * The device ID of the currently selected audio input device of the local participant (returned by the [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia))
   */
  audioDeviceId?: string;
  /**
   * The device ID of the currently selected video input device of the local participant (returned by the [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia))
   */
  videoDeviceId?: string;
} & StreamVideoParticipant;

/**
 * A partial representation of the StreamVideoParticipant.
 */
export type StreamVideoParticipantPatch = Partial<
  StreamVideoParticipant | StreamVideoLocalParticipant
>;

/**
 * A collection of {@link StreamVideoParticipantPatch} organized by sessionId.
 */
export type StreamVideoParticipantPatches = {
  [sessionId: string]: StreamVideoParticipantPatch;
};

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

export type TrackChangedEvent = {
  type: 'media_state_changed';
  track: MediaStreamTrack;
  change: MediaStateChange;
  reason: MediaStateChangeReason;
};

export type ParticipantJoinedEvent = {
  type: 'participant_joined';
};

export type ParticipantLeftEvent = {
  type: 'participant_left';
};

export type StatEvent =
  | TrackChangedEvent
  | ParticipantJoinedEvent
  | ParticipantLeftEvent;

export type StatEventListener = (event: StatEvent) => void;

export type CallOptions = {
  connectionConfig?: RTCConfiguration;
  latencyCheckUrl?: string;
  edgeName?: string;
};

export type PublishOptions = {
  preferredCodec?: string | null;
};
