import { OwnCapability } from '@stream-io/video-client';
import { useHasPermissions } from '@stream-io/video-react-bindings';

import { HostStateRouter } from './host/HostStateRouter';
import { ViewerStateRouter } from './viewer/ViewerStateRouter';

export const LivestreamUI = () => {
  const isHost = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);

  if (isHost) {
    return <HostStateRouter />;
  }

  return <ViewerStateRouter />;
};
