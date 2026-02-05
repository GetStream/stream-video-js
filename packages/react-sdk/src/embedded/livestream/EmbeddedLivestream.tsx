import type { EmbeddedLivestreamProps } from '../types';
import { EmbeddedClientProvider } from '../shared';
import { LivestreamUI } from './LivestreamUI';

/**
 * EmbeddedLivestream - Drop-in component for livestreaming.
 */
export const EmbeddedLivestream = (props: EmbeddedLivestreamProps) => (
  <EmbeddedClientProvider callType="livestream" {...props}>
    <LivestreamUI />
  </EmbeddedClientProvider>
);
