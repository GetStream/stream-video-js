import type {
  CallResponse,
  MemberResponse,
  UserResponse,
} from '../gen/coordinator';

export type UserResponseMap = {
  [userId: string]: UserResponse;
};

/**
 * @deprecated Use `CallState` instead.
 */
export class CallMetadata {
  /**
   * @deprecated Use `CallState.callSubject` instead.
   */
  call: CallResponse;

  /**
   * @deprecated Use `CallState.membersSubject` instead.
   */
  users: UserResponseMap;

  constructor(call: CallResponse, members?: MemberResponse[]) {
    this.call = call;
    this.users =
      members?.reduce<UserResponseMap>((acc, member) => {
        const user = member.user;
        acc[user.id!] = user;
        return acc;
      }, {}) ?? {};
  }
}
