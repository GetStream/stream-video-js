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
