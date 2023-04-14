import type {
  Participant,
  VideoDimension,
} from '../gen/video/sfu/models/models';
import { ReactionResponse } from '../gen/coordinator';

export type StreamReaction = Pick<
  ReactionResponse,
  'type' | 'emoji_code' | 'custom'
>;

export enum VisibilityState {
  UNKNOWN = 'UNKNOWN',
  VISIBLE = 'VISIBLE',
  INVISIBLE = 'INVISIBLE',
}

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

  /**
   * The last reaction this user has sent to this call.
   * Integrators can batch/collect past reactions and show them to the UI.
   */
  reaction?: StreamReaction;

  // FIXME OL: remove once this field once the deployed SFU is supporting it
  roles?: string[];

  /**
   * The visibility state of the participant's video element
   * within the pre-configured viewport.
   * @default VisibilityState.UNKNOWN
   */
  viewportVisibilityState?: VisibilityState;
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

export const isStreamVideoLocalParticipant = (
  p: StreamVideoParticipant | StreamVideoLocalParticipant,
): p is StreamVideoLocalParticipant => {
  return !!p.isLoggedInUser;
};

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

export type PublishOptions = {
  preferredCodec?: string | null;
};
