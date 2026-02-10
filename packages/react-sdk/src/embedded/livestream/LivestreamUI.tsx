import { OwnCapability } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

import { HostUI } from './host/HostUI';
import { ViewerUI } from './viewer/ViewerUI';
import { useLivestreamSortPreset } from '../hooks';

export const LivestreamUI = () => {
  const { useHasPermissions } = useCallStateHooks();

  useLivestreamSortPreset();

  const isHost = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);

  if (isHost) {
    return <HostUI />;
  }

  return <ViewerUI />;
};
