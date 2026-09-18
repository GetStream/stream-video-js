// Utility to join member names: one name, two names with "and",
// or the first two plus the remaining count.
export const generateCallTitle = (memberUserIds: string[]) => {
  if (memberUserIds.length === 0) {
    return '';
  }
  if (memberUserIds.length === 1) {
    return memberUserIds[0];
  }
  if (memberUserIds.length === 2) {
    return `${memberUserIds[0]} and ${memberUserIds[1]}`;
  }

  const remaining = memberUserIds.length - 2;
  return `${memberUserIds[0]}, ${memberUserIds[1]} and ${remaining} other`;
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
  let initials = (names[0] as string).substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += (names[names.length - 1] as string)
      .substring(0, 1)
      .toUpperCase();
  }
  return initials;
};

export * from './push/index';
export * from './enterPiPAndroid';
export * from './StreamVideoRN';
