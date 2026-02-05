import type { EmbeddedMeetingProps } from '../types';
import { EmbeddedClientProvider } from '../shared';
import { DefaultCallUI } from './DefaultCallUI';

/**
 * EmbeddedMeeting - Drop-in component for video meetings.
 */
export const EmbeddedMeeting = (props: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider callType="default" {...props}>
    <DefaultCallUI />
  </EmbeddedClientProvider>
);
