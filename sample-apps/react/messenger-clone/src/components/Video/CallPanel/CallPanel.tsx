import {
  CallingState,
  useCall,
  useCallCallingState,
  useConnectedUser,
} from '@stream-io/video-react-sdk';
import { ActiveCallPanel } from './ActiveCallPanel';
import { PendingCallPanel } from './PendingCallPanel';

export const CallPanel = () => {
  const call = useCall();
  const callingState = useCallCallingState();
  const localUser = useConnectedUser();

  if (!call) return null;

  if (callingState === CallingState.JOINED) {
    return <ActiveCallPanel activeCall={call} />;
  } else if (callingState === CallingState.RINGING && call.isCreatedByMe) {
    const [callee] = call.state.members;
    return (
      <PendingCallPanel
        outgoingCall={call}
        localUser={localUser}
        remoteUser={callee?.user}
      />
    );
  } else if (callingState === CallingState.RINGING && !call.isCreatedByMe) {
    const caller = call.data?.created_by;
    return (
      <PendingCallPanel
        incomingCall={call}
        localUser={localUser}
        remoteUser={caller}
      />
    );
  }
  return null;
};
