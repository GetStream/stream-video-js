import { getInitials } from '@stream-io/video-react-bindings';

// Utility to truncate long strings
export const generateParticipantTitle = (memberUserId: string) => {
  return memberUserId.length > 15
    ? memberUserId.slice(0, 15) + '...'
    : memberUserId;
};

// Utility to get initials of a name
export const getInitialsOfName = (name: string) =>
  getInitials(name).toUpperCase();

export * from './push/index';
export * from './StreamVideoRN';
