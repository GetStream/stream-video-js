import type { CSSProperties, ReactNode } from 'react';

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
 * An authenticated user with a known identity.
 * Requires a `token` or `tokenProvider` on the component props.
 */
export interface EmbeddedAuthenticatedUser {
  type: 'authenticated';
  id?: string;
  name: string;
  image?: string;
}

/**
 * A guest user — the server generates credentials automatically.
 */
export interface EmbeddedGuestUser {
  type: 'guest';
  id: string;
  name: string;
  image?: string;
}

/**
 * An anonymous user with no identity.
 * May optionally receive a call-scoped token via the `token` prop.
 */
export interface EmbeddedAnonymousUser {
  type: 'anonymous';
  id: '!anon';
  name?: string;
  image?: string;
}

/**
 * Discriminated union for embedded user configuration.
 *
 * Use the `type` field to specify the connection mode:
 * - `'authenticated'` — known user, provide `token` or `tokenProvider`
 * - `'guest'` — server generates credentials
 * - `'anonymous'` — no identity
 */
export type EmbeddedUser =
  | EmbeddedAuthenticatedUser
  | EmbeddedGuestUser
  | EmbeddedAnonymousUser;

/**
 * Base props shared by EmbeddedMeeting and EmbeddedLivestream.
 */
export interface EmbeddedClientBaseProps {
  apiKey: string;
  callType: string;
  callId: string;
  user: EmbeddedUser;
  token?: string;
  tokenProvider?: TokenProvider;
  logLevel?: LogLevel;
  layout?: LayoutOption;
  style?: CSSProperties;
  onError?: (error: any) => void;
  children?: ReactNode;
}

/**
 * Props for the EmbeddedMeeting component.
 */
export interface EmbeddedMeetingProps extends EmbeddedClientBaseProps {}

/**
 * Props for the EmbeddedLivestream component.
 */
export interface EmbeddedLivestreamProps extends EmbeddedClientBaseProps {}
