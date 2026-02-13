import type { EmbeddedLivestreamProps } from '../types';
import { EmbeddedClientProvider } from '../shared';
import { LivestreamUI } from './LivestreamUI';

/**
 * A drop-in livestream component that handles the full broadcast lifecycle.
 * Automatically renders host or viewer UI based on the user's permissions.
 *
 * Hosts see a lobby, go-live controls, and participant management.
 * Viewers see a waiting screen with early-join support and the live stream.
 *
 * Manages client and call initialization internally - just provide
 * an API key, user, and call ID to render a complete livestream experience.
 *
 * @example
 * ```tsx
 * // Authenticated host
 * <EmbeddedLivestream
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'authenticated', id: 'host-1', name: 'Jane' }}
 *   callId="my-stream"
 *   token="user-token"
 * />
 *
 * // Anonymous viewer
 * <EmbeddedLivestream
 *   apiKey="YOUR_API_KEY"
 *   user={{ type: 'anonymous' }}
 *   callId="my-stream"
 * />
 * ```
 */
export const EmbeddedLivestream = (props: EmbeddedLivestreamProps) => (
  <EmbeddedClientProvider {...props}>
    <LivestreamUI />
  </EmbeddedClientProvider>
);
