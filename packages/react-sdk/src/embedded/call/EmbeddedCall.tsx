import type { EmbeddedMeetingProps } from '../types';
import { EmbeddedClientProvider } from '../EmbeddedClientProvider';
import { CallStateRouter } from './CallStateRouter';

/**
 * A drop-in video call component that handles the full call lifecycle
 * including lobby, active call, and post-call feedback screens.
 *
 */
export const EmbeddedCall = ({ children, ...props }: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider {...props}>
    <CallStateRouter />
    {children}
  </EmbeddedClientProvider>
);
