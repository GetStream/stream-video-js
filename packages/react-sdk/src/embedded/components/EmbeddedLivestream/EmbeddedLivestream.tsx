import type { EmbeddedLivestreamProps } from '../../types';
import { EmbeddedClientProvider } from '../EmbeddedClientProvider';
import { LivestreamUI } from '../Livestream';

/**
 * EmbeddedLivestream.
 */
export const EmbeddedLivestream = (props: EmbeddedLivestreamProps) => (
  <EmbeddedClientProvider callType="livestream" {...props}>
    <LivestreamUI />
  </EmbeddedClientProvider>
);
