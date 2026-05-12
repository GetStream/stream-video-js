import type { ReactNode } from 'react';
import type { LogLevel, TokenProvider } from '@stream-io/video-client';

/**
 * Available layout options.
 */
export type LayoutOption =
  | 'Livestream'
  | 'PaginatedGrid'
  | 'SpeakerLeft'
  | 'SpeakerRight'
  | 'SpeakerTop'
  | 'SpeakerBottom';

/**
 * An authenticated user with a known identity.
 * Requires a `token` or `tokenProvider` on the component props.
 */
export interface EmbeddedAuthenticatedUser {
  type?: 'authenticated';
  id: string;
  name?: string;
  image?: string;
}

/**
 * A guest user — the server generates credentials automatically.
 */
export interface EmbeddedGuestUser {
  type: 'guest';
  id: string;
  name?: string;
  image?: string;
}

/**
 * An anonymous user with no identity.
 * May optionally receive a call-scoped token via the `token` prop.
 */
export interface EmbeddedAnonymousUser {
  type: 'anonymous';
  id?: '!anon';
  name?: string;
  image?: string;
}

/**
 * Discriminated union for embedded user configuration.
 */
export type EmbeddedUser =
  | EmbeddedAuthenticatedUser
  | EmbeddedGuestUser
  | EmbeddedAnonymousUser;

/**
 * Base props shared by EmbeddedCall and EmbeddedLivestream.
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
  theme?: Record<string, string>;
  onError?: (error: any) => void;
  children?: ReactNode;
}

/**
 * Props for the EmbeddedCall component.
 */
export interface EmbeddedMeetingProps extends EmbeddedClientBaseProps {}

/**
 * Props for the EmbeddedLivestream component.
 */
export interface EmbeddedLivestreamProps extends EmbeddedClientBaseProps {}
