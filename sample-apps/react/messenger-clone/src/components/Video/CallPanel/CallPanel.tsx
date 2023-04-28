import {
  CallingState,
  useCall,
  useCallCallingState,
  useConnectedUser,
  useIncomingCalls,
  useOutgoingCalls,
  User,
} from '@stream-io/video-react-sdk';
import { ActiveCallPanel } from './ActiveCallPanel';
import { PendingCallPanel } from './PendingCallPanel';

export const CallPanel = () => {
  const activeCall = useCall();
  const callingState = useCallCallingState();
  const [outgoingCall] = useOutgoingCalls();
  const [incomingCall] = useIncomingCalls();
  const localUser = useConnectedUser();
  // todo: How we can get remote user data?
  const remoteUser = {} as User;

  if (activeCall && callingState === CallingState.JOINED) {
    return <ActiveCallPanel activeCall={activeCall} />;
  } else if (outgoingCall) {
    return (
      <PendingCallPanel
        outgoingCall={outgoingCall}
        localUser={localUser}
        remoteUser={remoteUser}
      />
    );
  } else if (incomingCall) {
    return (
      <PendingCallPanel
        incomingCall={incomingCall}
        localUser={localUser}
        remoteUser={remoteUser}
      />
    );
  }
  return null;
};
