import { StreamVideoEvent } from '../coordinator/connection/types';
import { CallState } from '../store';

/**
 * Watches for `call.member_added` events.
 */
export const watchCallMemberAdded = (state: CallState) => {
  return function onCallMemberAdded(event: StreamVideoEvent) {
    if (event.type !== 'call.member_added') return;
    state.setMembers((members) => [...members, ...event.members]);
  };
};

/**
 * Watches for `call.member_removed` events.
 */
export const watchCallMemberRemoved = (state: CallState) => {
  return function onCallMemberRemoved(event: StreamVideoEvent) {
    if (event.type !== 'call.member_removed') return;
    state.setMembers((members) =>
      members.filter((m) => event.members.indexOf(m.user_id) === -1),
    );
  };
};

/**
 * Watches for `call.member_updated_permission` events.
 */
export const watchCallMemberUpdatedPermission = (state: CallState) => {
  return function onCallMemberUpdated(event: StreamVideoEvent) {
    if (event.type !== 'call.member_updated_permission') return;
    state.setMembers((members) =>
      members.map((member) => {
        const memberUpdate = event.members.find(
          (m) => m.user_id === member.user_id,
        );
        if (memberUpdate) {
          member.user.role = memberUpdate.role!;
          member = { ...member };
        }
        return member;
      }),
    );
  };
};

/**
 * Watches for `call.member_updated` events.
 */
export const watchCallMemberUpdated = (state: CallState) => {
  return function onCallMemberUpdated(event: StreamVideoEvent) {
    if (event.type !== 'call.member_updated') return;
    state.setMembers((members) =>
      members.map((member) => {
        const memberUpdate = event.members.find(
          (m) => m.user_id === member.user_id,
        );
        return memberUpdate ? memberUpdate : member;
      }),
    );
  };
};
