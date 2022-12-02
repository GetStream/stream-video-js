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

  const allMemebersExceptLast = supportedAmountOfMemberUserIds.slice(0, -1);
  const lastMember = supportedAmountOfMemberUserIds.slice(-1)[0];
  return `${allMemebersExceptLast.join(', ')}, and ${lastMember}`;
};
