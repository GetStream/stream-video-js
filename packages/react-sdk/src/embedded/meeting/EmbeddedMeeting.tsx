import type { EmbeddedMeetingProps } from '../types';
import { EmbeddedClientProvider } from '../shared';
import { CallStateRouter } from './CallStateRouter';

/**
 * A drop-in video meeting component that handles the full call lifecycle
 * including lobby, active call, and post-call feedback screens.
 *
 * Manages client and call initialization internally - just provide
 * an API key, user, and call ID to render a complete meeting experience.
 *
 * @example
 * ```tsx
 * // Authenticated user
 * <EmbeddedMeeting
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'authenticated', id: 'user-1', name: 'John' }}
 *   callId="my-meeting"
 *   token="user-token"
 * />
 *
 * // Guest user
 * <EmbeddedMeeting
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'guest', id: 'guest-1', name: 'Visitor' }}
 *   callId="my-meeting"
 * />
 *
 * // Anonymous user
 * <EmbeddedMeeting
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'anonymous' }}
 *   callId="my-meeting"
 * />
 * ```
 */
export const EmbeddedMeeting = (props: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider {...props}>
    <CallStateRouter />
  </EmbeddedClientProvider>
);
