import { LoadingIndicator, useActiveCall } from '@stream-io/video-react-sdk';
import { Lobby } from './Lobby';
import { ActiveCall } from './ActiveCall';
import { useLoadingState } from '../../context/LoadingStateContext';

export const UI = () => {
  const activeCall = useActiveCall();
  const { loading } = useLoadingState();

  if (activeCall) {
    return <ActiveCall call={activeCall} />;
  } else if (loading) {
    return <LoadingIndicator text="Connecting ..." />;
  }
  return <Lobby />;
};
