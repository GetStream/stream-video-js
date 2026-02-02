/**
 * User type for authentication.
 */
export type UserType = 'authenticated' | 'guest' | 'anonymous';

/**
 * Role for livestream calls.
 * - 'host': Can create the call and will be assigned host capabilities
 * - 'viewer': Can only join existing calls as a viewer
 */
export type LivestreamRole = 'host' | 'viewer';

/**
 * Log level for the StreamVideoClient.
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/**
 * Available layout options.
 */
export type LayoutOption =
  | 'PaginatedGrid'
  | 'SpeakerLeft'
  | 'SpeakerRight'
  | 'SpeakerTop'
  | 'SpeakerBottom';

/**
 * User configuration for the embedded client.
 */
export interface EmbeddedUser {
  id: string;
  name?: string;
  image?: string;
  type?: UserType;
  token?: string;
}

/**
 * Call configuration for the embedded client.
 */
export interface EmbeddedCallConfig {
  id: string;
  type?: string;
  role?: LivestreamRole;
}

/**
 * Token provider function for automatic token refresh.
 */
export type TokenProvider = () => Promise<string>;

/**
 * Props for the EmbeddedStreamClient component.
 */
export interface EmbeddedStreamClientProps {
  apiKey: string;
  user: EmbeddedUser;
  call: EmbeddedCallConfig;
  tokenProvider?: TokenProvider;
  skipLobby?: boolean;
  layout?: LayoutOption;
  logLevel?: LogLevel;
  enableNoiseCancellation?: boolean;
  enableBackgroundFilters?: boolean;
  onCallEnded?: () => void;
  onError?: (error: Error) => void;
}
