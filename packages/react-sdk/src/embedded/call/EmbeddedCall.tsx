import type { EmbeddedMeetingProps } from '../types';
import { EmbeddedClientProvider } from '../EmbeddedClientProvider';
import { CallStateRouter } from './CallStateRouter';

/**
 * Drop-in video call component that renders a lobby, active call,
 * and post-call feedback screen. Handles client and call setup internally.
 */
export const EmbeddedCall = ({ children, ...props }: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider {...props}>
    <CallStateRouter />
    {children}
  </EmbeddedClientProvider>
);
