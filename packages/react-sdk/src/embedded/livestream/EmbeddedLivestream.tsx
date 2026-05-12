import type { EmbeddedLivestreamProps } from '../types';
import { EmbeddedClientProvider } from '../EmbeddedClientProvider';
import { LivestreamUI } from './LivestreamUI';

/**
 * Drop-in livestream component. Renders host or viewer UI based on permissions.
 */
export const EmbeddedLivestream = ({
  children,
  ...props
}: EmbeddedLivestreamProps) => (
  <EmbeddedClientProvider {...props}>
    <LivestreamUI />
    {children}
  </EmbeddedClientProvider>
);
