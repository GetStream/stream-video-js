import { OwnCapability, useCallStateHooks } from '@stream-io/video-react-sdk';

import { useLivestreamCall } from '../../hooks';
import { ConnectionNotification } from '../ConnectionNotification';
import { HostLivestreamUI } from './Host/HostLivestreamUI';
import { ViewerLivestreamUI } from './Viewer/ViewerLivestreamUI';

const LivestreamUI = () => {
  useLivestreamCall();

  const { useHasPermissions } = useCallStateHooks();
  const isHost = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);

  return (
    <div className="rd__livestream-container">
      {isHost ? <HostLivestreamUI /> : <ViewerLivestreamUI />}
      <ConnectionNotification />
    </div>
  );
};
export default LivestreamUI;
