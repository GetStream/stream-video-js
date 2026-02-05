import type { CSSProperties } from 'react';

/**
 * User type for authentication.
 * - 'authenticated': Full auth with JWT (default when token/tokenProvider provided)
 * - 'guest': Server generates credentials via /guest endpoint
 * - 'anonymous': No WebSocket, limited access (default when no token)
 */
export type UserType = 'authenticated' | 'guest' | 'anonymous';

/**
 * Log level for the StreamVideoClient.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

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
 */
export interface EmbeddedUser {
  id: string;
  name?: string;
  image?: string;
}

/**
 * Configuration props for the embedded client.
 */
export interface ConfigurationProviderProps {
  /**
   * Layout option for the call.
   */
  layout?: LayoutOption;
  /**
   * Callback when an error occurs (e.g., join failure).
   */
  onError?: (error: Error) => void;
}

/**
 * Base props shared by EmbeddedMeeting and EmbeddedLivestream.
 */
export interface EmbeddedClientBaseProps extends ConfigurationProviderProps {
  apiKey: string;
  user: EmbeddedUser;
  callId: string;
  token?: string;
  tokenProvider?: TokenProvider;
  userType?: UserType;
  logLevel?: LogLevel;
  onError?: (error: Error) => void;
  style?: CSSProperties;
}

/**
 * Props for the EmbeddedMeeting component.
 */
export interface EmbeddedMeetingProps extends EmbeddedClientBaseProps {}

/**
 * Props for the EmbeddedLivestream component.
 */
export interface EmbeddedLivestreamProps extends EmbeddedClientBaseProps {}
