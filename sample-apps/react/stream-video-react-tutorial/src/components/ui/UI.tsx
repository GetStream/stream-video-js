import {
  LoadingIndicator,
  useActiveCall,
  usePendingCalls,
} from '@stream-io/video-react-sdk';
import { Lobby } from './Lobby';
import { ActiveCall } from './ActiveCall';

export const UI = () => {
  const activeCall = useActiveCall();
  const pendingCalls = usePendingCalls();

  if (activeCall) {
    return <ActiveCall />;
  } else if (pendingCalls.length) {
    return <LoadingIndicator text="Connecting ..." />;
  }
  return <Lobby />;
};
