import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../ConfigurationContext';
import { Layout, ScreenshareLayout, layoutMap } from './layouts';
import { Spotlight } from './layouts/Spotlight';

const DEFAULT_LAYOUT: Layout = 'spotlight';
const DEFAULT_SCREENSHARE_LAYOUT: ScreenshareLayout = 'spotlight';

export const UIDispatcher = () => {
  const {
    layout = DEFAULT_LAYOUT,
    screenshare_layout = DEFAULT_SCREENSHARE_LAYOUT,
  } = useConfigurationContext();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const DefaultView = layoutMap[layout]?.[0] ?? Spotlight;
  const ScreenShareView = layoutMap[screenshare_layout]?.[1] ?? Spotlight;

  return hasScreenShare ? <ScreenShareView /> : <DefaultView />;
};
