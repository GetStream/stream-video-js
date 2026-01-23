import {
  LivestreamLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { ViewerBackstage } from './ViewerBackstage';

export const ViewerLivestreamUI = () => {
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();

  if (!isLive) {
    return <ViewerBackstage />;
  }

  return <LivestreamLayout />;
};
