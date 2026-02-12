import type { CSSProperties } from 'react';

/**
 * Log level for the StreamVideoClient.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/**
 * Identifies where an error originated during initialization.
 */
export type EmbeddedErrorType = 'client' | 'call' | 'join';

/**
 * Available layout options (internal use only).
 */
export type LayoutOption =
  | 'PaginatedGrid'
  | 'SpeakerLeft'
  | 'SpeakerRight'
  | 'SpeakerTop'
  | 'SpeakerBottom';

/**
 * Token provider function for automatic token refresh.
 */
export type TokenProvider = () => Promise<string>;

/**
 * User configuration for the embedded client.
 *
 * - Authenticated: provide `user` with `token` or `tokenProvider`
 * - Guest: provide `user` without token (server generates credentials)
 * - Anonymous: omit the `user` prop entirely
 */
export interface EmbeddedUser {
  id: string;
  name: string;
  image?: string;
}

/**
 * Base props shared by EmbeddedMeeting and EmbeddedLivestream.
 */
export interface EmbeddedClientBaseProps {
  apiKey: string;
  callId: string;
  user?: EmbeddedUser;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  style?: CSSProperties;
  onError?: (error: any) => void;
}

/**
 * Props for the EmbeddedMeeting component.
 */
export interface EmbeddedMeetingProps extends EmbeddedClientBaseProps {
  layout?: LayoutOption;
}

/**
 * Props for the EmbeddedLivestream component.
 */
export interface EmbeddedLivestreamProps extends EmbeddedClientBaseProps {}
