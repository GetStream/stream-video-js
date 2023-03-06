import { MAX_AVATARS_IN_VIEW } from '../constants';

// Utility to join strings with commas and 'and'
export const generateCallTitle = (memberUserIds: string[]) => {
  const supportedAmountOfMemberUserIds = memberUserIds.slice(
    0,
    MAX_AVATARS_IN_VIEW,
  );
  if (supportedAmountOfMemberUserIds.length < MAX_AVATARS_IN_VIEW) {
    return supportedAmountOfMemberUserIds.join(' and ');
  }

  const allMembersExceptLast = supportedAmountOfMemberUserIds.slice(0, -1);
  const lastMember = supportedAmountOfMemberUserIds.slice(-1)[0];
  return `${allMembersExceptLast.join(', ')}, and ${lastMember}`;
};

// Utility to truncate long strings
export const generateParticipantTitle = (memberUserId: string) => {
  return memberUserId.length > 15
    ? memberUserId.slice(0, 15) + '...'
    : memberUserId;
};

// Utility to get initials of a name
export const getInitialsOfName = (name: string) => {
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};
