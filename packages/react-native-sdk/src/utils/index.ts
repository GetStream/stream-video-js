import { MAX_AVATARS_IN_VIEW } from '../constants';

// Utility to join strings with commas and 'and'
export const generateCallTitle = (memberUserIds: string[]) => {
  const members = memberUserIds.slice(0, MAX_AVATARS_IN_VIEW);
  if (members.length < MAX_AVATARS_IN_VIEW) {
    return members.join(' and ');
  }

  const allMemebersExceptLast = members.slice(0, -1);
  const lastMember = members.slice(-1)[0];
  return `${allMemebersExceptLast.join(', ')}, and ${lastMember}`;
};
