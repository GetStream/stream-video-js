import { OwnCapability } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

import { HostUI } from './host/HostUI';
import { ViewerUI } from './viewer/ViewerUI';

export const LivestreamUI = () => {
  const { useHasPermissions } = useCallStateHooks();
  const isHost = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);

  if (isHost) {
    return <HostUI />;
  }

  return <ViewerUI />;
};
