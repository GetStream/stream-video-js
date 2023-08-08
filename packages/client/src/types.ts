import type {
  Participant,
  VideoDimension,
} from './gen/video/sfu/models/models';
import type {
  CallResponse,
  JoinCallRequest,
  MemberResponse,
  OwnCapability,
  ReactionResponse,
} from './gen/coordinator';
import type { StreamClient } from './coordinator/connection/client';
import type { Comparator } from './sorting';
import type { StreamVideoWriteableStateStore } from './store';
import { AxiosError } from 'axios';

export type StreamReaction = Pick<
  ReactionResponse,
  'type' | 'emoji_code' | 'custom'
>;

export enum VisibilityState {
  UNKNOWN = 'UNKNOWN',
  VISIBLE = 'VISIBLE',
  INVISIBLE = 'INVISIBLE',
}

export enum DebounceType {
  IMMEDIATE = 0,
  FAST = 100,
  MEDIUM = 600,
  SLOW = 1200,
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
  isLocalParticipant?: boolean;

  /**
   * The pin state of the participant.
   */
  pin?: ParticipantPin;

  /**
   * The last reaction this user has sent to this call.
   * Integrators can batch/collect past reactions and show them to the UI.
   */
  reaction?: StreamReaction;

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
   *
   * @deprecated use call.microphone.state.selectedDevice
   */
  audioDeviceId?: string;

  /**
   * The device ID of the currently selected video input device of the local participant (returned by the [MediaDevices API](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia))
   *
   * @deprecated use call.camera.state.selectedDevice
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
 * Represents a participant's pin state.
 */
export type ParticipantPin = {
  /**
   * Set to true if the participant is pinned by the local user.
   * False if the participant is pinned server-side, by the call moderator.
   */
  isLocalPin: boolean;

  /**
   * Timestamp when the participant is pinned.
   */
  pinnedAt: number;
};

export const isStreamVideoLocalParticipant = (
  p: StreamVideoParticipant | StreamVideoLocalParticipant,
): p is StreamVideoLocalParticipant => {
  return !!p.isLocalParticipant;
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

export type CallLeaveOptions = {
  /**
   * If true, the caller will get a `call.rejected` event.
   * Has an effect only if the call is in the `ringing` state.
   *
   * @default `false`.
   */
  reject?: boolean;
};

/**
 * The options to pass to {@link Call} constructor.
 */
export type CallConstructor = {
  /**
   * The streamClient instance to use.
   */
  streamClient: StreamClient;

  /**
   * The Call type.
   */
  type: string;

  /**
   * The Call ID.
   */
  id: string;

  /**
   * An optional {@link CallResponse} metadata from the backend.
   * If provided, the call will be initialized with the data from this object.
   * This is useful when initializing a new "pending call" from an event.
   */
  metadata?: CallResponse;

  /**
   * An optional list of {@link MemberResponse} from the backend.
   * If provided, the call will be initialized with the data from this object.
   * This is useful when initializing a new "pending call" from an event.
   */
  members?: MemberResponse[];

  /**
   * An optional list of {@link OwnCapability} coming from the backed.
   * If provided, the call will be initialized with the data from this object.
   * This is useful when initializing a new "pending call" from an event.
   */
  ownCapabilities?: OwnCapability[];

  /**
   * Flags the call as a ringing call.
   * @default false
   */
  ringing?: boolean;

  /**
   * Set to true if this call instance should receive updates from the backend.
   *
   * @default false.
   */
  watching?: boolean;

  /**
   * The default comparator to use when sorting participants.
   */
  sortParticipantsBy?: Comparator<StreamVideoParticipant>;

  /**
   * The state store of the client
   */
  clientStore: StreamVideoWriteableStateStore;
};

/**
 * The options to pass to {@link Call.join} method.
 */
export type JoinCallData = Omit<JoinCallRequest, 'location'>;
export { AxiosError };
