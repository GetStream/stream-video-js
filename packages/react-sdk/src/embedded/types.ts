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
   * Skip the lobby/device setup screen and auto-join.
   */
  skipLobby?: boolean;
  /**
   * Layout option for the call.
   */
  layout?: LayoutOption;
}

/**
 * Props for the EmbeddedStreamClient component.
 */
export interface EmbeddedStreamClientProps extends ConfigurationProviderProps {
  apiKey: string;
  user: EmbeddedUser;
  callId: string;
  callType?: string;
  token?: string;
  tokenProvider?: TokenProvider;
  userType?: UserType;
  logLevel?: LogLevel;
  onError?: (error: Error) => void;
  style?: CSSProperties;
}
