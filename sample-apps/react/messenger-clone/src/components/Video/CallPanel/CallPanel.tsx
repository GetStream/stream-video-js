import {
  CallingState,
  useCall,
  useCallCallingState,
  useConnectedUser,
  useIncomingCalls,
  useOutgoingCalls,
} from '@stream-io/video-react-sdk';
import { ActiveCallPanel } from './ActiveCallPanel';
import { PendingCallPanel } from './PendingCallPanel';

export const CallPanel = () => {
  const activeCall = useCall();
  const callingState = useCallCallingState();
  const [outgoingCall] = useOutgoingCalls();
  const [incomingCall] = useIncomingCalls();
  const localUser = useConnectedUser();

  if (activeCall && callingState === CallingState.JOINED) {
    return <ActiveCallPanel activeCall={activeCall} />;
  } else if (outgoingCall) {
    const [callee] = outgoingCall.state.members;
    return (
      <PendingCallPanel
        outgoingCall={outgoingCall}
        localUser={localUser}
        remoteUser={callee?.user}
      />
    );
  } else if (incomingCall) {
    const caller = incomingCall.data?.created_by;
    return (
      <PendingCallPanel
        incomingCall={incomingCall}
        localUser={localUser}
        remoteUser={caller}
      />
    );
  }
  return null;
};
