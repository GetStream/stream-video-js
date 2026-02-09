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
 * <EmbeddedMeeting
 *   apiKey="YOUR_API_KEY"
 *   user={{ id: 'user-1', name: 'John' }}
 *   callId="my-meeting"
 *   token="user-token"
 * />
 * ```
 */
export const EmbeddedMeeting = (props: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider callType="default" {...props}>
    <CallStateRouter />
  </EmbeddedClientProvider>
);
