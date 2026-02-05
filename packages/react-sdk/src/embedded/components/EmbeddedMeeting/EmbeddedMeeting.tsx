import type { EmbeddedMeetingProps } from '../../types';
import { EmbeddedClientProvider } from '../EmbeddedClientProvider';
import { DefaultCallUI } from '../DefaultCall';

/**
 * EmbeddedMeeting.
 */
export const EmbeddedMeeting = (props: EmbeddedMeetingProps) => (
  <EmbeddedClientProvider callType="default" {...props}>
    <DefaultCallUI />
  </EmbeddedClientProvider>
);
