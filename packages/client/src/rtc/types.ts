import type { UserResponse } from '../gen/coordinator';
import type {
  Participant,
  VideoDimension,
} from '../gen/video/sfu/models/models';

export interface StreamVideoParticipant extends Participant {
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
   * Set it to `undefined` to unsubscribe from this participant's video.
   */
  videoDimension?: VideoDimension;

  /**
   * The preferred screen share dimensions for this participant.
   * Set it to `undefined` to unsubscribe from this participant's screen share.
   */
  screenShareDimension?: VideoDimension;

  /**
   * True if the participant is the local participant.
   */
  isLoggedInUser?: boolean;

  /**
   * True when the participant is pinned
   */
  isPinned?: boolean;
}

export interface StreamVideoLocalParticipant extends StreamVideoParticipant {
  /**
   * The device ID of the currently selected audio input device of the local participant (returned by the [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia))
   */
  audioDeviceId?: string;
  /**
   * The device ID of the currently selected video input device of the local participant (returned by the [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia))
   */
  videoDeviceId?: string;

  /**
   * The device ID of the currently selected audio output device of the local participant (returned by the [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia))
   *
   * If the value is not defined, the user hasn't selected any device (in these cases the default system audio output could be used)
   */
  audioOutputDeviceId?: string;
}

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
  dimension: VideoDimension | undefined;
};

export type SubscriptionChanges = {
  [sessionId: string]: SubscriptionChange;
};

export type CallOptions = {
  connectionConfig?: RTCConfiguration;
  edgeName?: string;
};

export type PublishOptions = {
  preferredCodec?: string | null;
};
