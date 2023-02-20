import type {
  CallResponse,
  MemberResponse,
  UserResponse,
} from '../gen/coordinator';

export type UserResponseMap = {
  [userId: string]: UserResponse;
};

export class CallMetadata {
  call: CallResponse;
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
