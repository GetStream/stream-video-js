import { Call, User, UserResponse } from '@stream-io/video-client';
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

// Utility to generate array of member user ids from outgoing call meta data
export const getMembersForOutgoingCall = (
  outgoingCall: Call,
): UserResponse[] => {
  const users = outgoingCall.state.members;
  return users.map((member) => member.user);
};

// Utility to generate array of member user ids from incoming call meta data
export const getMembersForIncomingCall = (
  incomingCall: Call,
  connectedUser: User | undefined,
): UserResponse[] => {
  const meta = incomingCall.state.metadata;
  const users = incomingCall.state.members;
  let members: UserResponse[] = [];
  Object.values(users).forEach((user) => {
    if (connectedUser?.id !== user.user_id) members.push(user.user);
  });
  const callCreatedBy = meta!.created_by;
  members.push(callCreatedBy);

  return members;
};
