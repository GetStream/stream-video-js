import { Call, CallDetails } from '../gen/video/coordinator/call_v1/call';
import { User } from '../gen/video/coordinator/user_v1/user';

export type PendingCall = {
  call?: Call;
  callDetails?: CallDetails;
};

// todo: unify callDetails and details
// export type ActiveCallData = PendingCall & {
//   users: {
//     [key: string]: User;
//   };
// };
export type ActiveCallData = {
  call?: Call;
  details?: CallDetails;
  users: {
    [key: string]: User;
  };
};
