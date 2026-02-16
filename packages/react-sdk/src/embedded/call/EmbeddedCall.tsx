import type { EmbeddedMeetingProps } from '../types';
import { EmbeddedClientProvider } from '../EmbeddedClientProvider';
import { CallStateRouter } from './CallStateRouter';

/**
 * A drop-in video call component that handles the full call lifecycle
 * including lobby, active call, and post-call feedback screens.
 *
 * Manages client and call initialization internally - just provide
 * an API key, user, and call ID to render a complete call experience.
 *
 * @example
 * ```tsx
 * // Authenticated user
 * <EmbeddedCall
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'authenticated', id: 'user-1', name: 'John' }}
 *   callId="my-call"
 *   callType="default"
 *   token="user-token"
 * />
 *
 * // Guest user
 * <EmbeddedCall
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'guest', id: 'guest-1', name: 'Visitor' }}
 *   callId="my-call"
 *   callType="default"
 * />
 *
 * // Anonymous user
 * <EmbeddedCall
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'anonymous' }}
 *   callId="my-call"
 *   callType="default"
 * />
 *
 * // With additional content alongside the default UI
 * <EmbeddedCall
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'authenticated', id: 'user-1', name: 'John' }}
 *   callId="my-call"
 *   callType="default"
 *   token="user-token"
 * >
 *   <MyCustomPanel />
 * </EmbeddedCall>
 * ```
 */
export const EmbeddedCall = ({ children, ...props }: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider {...props}>
    <CallStateRouter />
    {children}
  </EmbeddedClientProvider>
);
