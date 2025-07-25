import type {
  Participant,
  TrackType,
  VideoDimension,
} from './gen/video/sfu/models/models';
import type {
  JoinCallRequest,
  MemberResponse,
  OwnCapability,
  ReactionResponse,
} from './gen/coordinator';
import type { StreamClient } from './coordinator/connection/client';
import type { Comparator } from './sorting';
import type { StreamVideoWriteableStateStore } from './store';
import { AxiosError } from 'axios';
import { RejectReason } from './coordinator/connection/types';

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
  IMMEDIATE = 20,
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
   * The participant's screen audio stream, if they are sharing their audio,
   * and we are subscribed to it.
   */
  screenShareAudioStream?: MediaStream;

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
   * A list of tracks that are currently paused by our servers.
   * Typically, a server-side pause happens when the local participant doesn't
   * have enough bandwidth to receive all tracks. In this case, the server
   * will pause some tracks to optimize the bandwidth usage.
   * Once the bandwidth is restored, the server will resume the paused tracks.
   * This is useful to avoid any unwanted video and audio artifacts.
   */
  pausedTracks?: TrackType[];

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
   * The visibility state of the participant's tracks within a defined viewport.
   */
  viewportVisibilityState?: Record<VideoTrackType, VisibilityState>;

  /**
   * The volume of the participant's audio stream (from 0 to 1).
   * Set it to `undefined` to use the default volume.
   *
   * Note: this value is not applicable in React Native.
   */
  audioVolume?: number;
}

export type VideoTrackType = 'videoTrack' | 'screenShareTrack';
export type AudioTrackType = 'audioTrack' | 'screenShareAudioTrack';
export type TrackMuteType =
  | 'audio'
  | 'video'
  | 'screenshare'
  | 'screenshare_audio';

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

export type ClosedCaptionsSettings = {
  /**
   * The time in milliseconds to keep a closed caption in the state (visible).
   * Default is 2700 ms.
   */
  visibilityDurationMs?: number;
  /**
   * The maximum number of closed captions to keep in the state (visible).
   * When the maximum number is reached, the oldest closed caption is removed.
   *
   * Default is 2.
   */
  maxVisibleCaptions?: number;
};

/**
 * A partial representation of the StreamVideoParticipant.
 */
export type StreamVideoParticipantPatch = Partial<StreamVideoParticipant>;

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

/**
 * A preferred codec to use when publishing a video or audio track.
 * @internal
 */
export type PreferredCodec = 'vp8' | 'h264' | 'vp9' | 'av1';

/**
 * A collection of track publication options.
 * @internal
 */
export type ClientPublishOptions = {
  /**
   * The preferred codec to use when publishing the video stream.
   */
  preferredCodec?: PreferredCodec;
  /**
   * The fmtp line for the video codec.
   */
  fmtpLine?: string;
  /**
   * The preferred bitrate to use when publishing the video stream.
   */
  preferredBitrate?: number;
  /**
   * The maximum number of simulcast layers to use when publishing the video stream.
   */
  maxSimulcastLayers?: number;
  /**
   * The preferred subscription (incoming video stream) codec.
   */
  subscriberCodec?: PreferredCodec;
  /**
   * The fmtp line for the subscriber codec.
   */
  subscriberFmtpLine?: string;
  /**
   * Screen share settings.
   */
  screenShareSettings?: ScreenShareSettings;
};

export type ScreenShareSettings = {
  /**
   * Limits the maximum framerate (in frames per second) of the screen share.
   * Defaults to 30.
   */
  maxFramerate?: number;

  /**
   * Limits the maximum bitrate (in bits per second) of the screen share.
   * Defaults to 3000000 (3Mbps).
   */
  maxBitrate?: number;

  /**
   * The content hint to use when publishing the screen share.
   * This can be used to optimize the video quality for different types of content.
   *
   * Defaults to '' (no hint, browser's default behavior).
   * Use 'motion' for video content, 'detail' for presentations or documents, and 'text' for text-heavy content.
   *
   * Please read the documentation for more information on content hints:
   * - https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/contentHint
   */
  contentHint?: '' | 'motion' | 'detail' | 'text';
};

export type CallLeaveOptions = {
  /**
   * If true, the caller will get a `call.rejected` event.
   * Has an effect only if the call is in the `ringing` state.
   */
  reject?: boolean;

  /**
   * The reason for leaving the call.
   * This will be sent as the `reason` field in the `call.rejected` event.
   */
  reason?: RejectReason;

  /**
   * You can provide extra information about why the call is being left and/or rejected, used for logging purposes.
   */
  message?: string;
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
