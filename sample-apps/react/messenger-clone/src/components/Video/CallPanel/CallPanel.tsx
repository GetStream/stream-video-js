import { User } from '@stream-io/video-client';
import {
  useActiveCall,
  useConnectedUser,
  useIncomingCalls,
  useLocalParticipant,
  useOutgoingCalls,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';
import { ActiveCallPanel } from './ActiveCallPanel';
import { PendingCallPanel } from './PendingCallPanel';

export const CallPanel = () => {
  const activeCall = useActiveCall();
  const localParticipant = useLocalParticipant();
  const [remoteParticipant] = useRemoteParticipants();
  const [outgoingCall] = useOutgoingCalls();
  const [incomingCall] = useIncomingCalls();
  const localUser = useConnectedUser();
  // todo: How we can get remote user data?
  const remoteUser = {} as User;

  if (activeCall) {
    return (
      <ActiveCallPanel
        activeCall={activeCall}
        localParticipant={localParticipant}
        remoteParticipant={remoteParticipant}
      />
    );
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
