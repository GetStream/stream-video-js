import { BehaviorSubject } from 'rxjs';

export const pushAcceptedIncomingCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);

export const pushRejectedIncomingCallCId$ = new BehaviorSubject<
  string | undefined
>(undefined);
