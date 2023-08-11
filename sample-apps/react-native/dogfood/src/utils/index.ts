// Utility to truncate long strings
export const generateParticipantTitle = (memberUserId: string) => {
  return memberUserId.length > 15
    ? memberUserId.slice(0, 15) + '...'
    : memberUserId;
};
