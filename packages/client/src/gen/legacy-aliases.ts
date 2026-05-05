import type {
  CoordinatesResponse,
  ICEServerResponse,
  LocationResponse,
  SendVideoReactionRequest,
  SendVideoReactionResponse,
  SIPChallengeRequest,
  VideoReactionResponse,
} from './coordinator';

/** @deprecated Use {@link SendVideoReactionRequest} instead. */
export type SendReactionRequest = SendVideoReactionRequest;

/** @deprecated Use {@link SendVideoReactionResponse} instead. */
export type SendReactionResponse = SendVideoReactionResponse;

/** @deprecated Use {@link VideoReactionResponse} instead. */
export type ReactionResponse = VideoReactionResponse;

/** @deprecated Use {@link CoordinatesResponse} instead. */
export type Coordinates = CoordinatesResponse;

/** @deprecated Use {@link LocationResponse} instead. */
export type Location = LocationResponse;

/** @deprecated Use {@link ICEServerResponse} instead. */
export type ICEServer = ICEServerResponse;

/** @deprecated Use {@link SIPChallengeRequest} instead. */
export type SIPChallenge = SIPChallengeRequest;
