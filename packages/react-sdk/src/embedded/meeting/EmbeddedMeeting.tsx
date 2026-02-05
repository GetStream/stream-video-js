import type { EmbeddedMeetingProps } from '../types';
import { EmbeddedClientProvider } from '../shared';
import { CallStateRouter } from './CallStateRouter';

/**
 * EmbeddedMeeting - Drop-in component for video meetings.
 */
export const EmbeddedMeeting = (props: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider callType="default" {...props}>
    <CallStateRouter />
  </EmbeddedClientProvider>
);
