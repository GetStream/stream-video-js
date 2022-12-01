import type {
  Participant,
  VideoDimension,
} from '../gen/video/sfu/models/models';

export type StreamVideoParticipant = {
  videoStream?: MediaStream;
  audioStream?: MediaStream;
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
  /**
   * True when the participant is pinned
   */
  isPinned?: boolean;
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

export type CallOptions = {
  connectionConfig?: RTCConfiguration;
  latencyCheckUrl?: string;
  edgeName?: string;
};

export type PublishOptions = {
  preferredVideoCodec?: string | null;
};
