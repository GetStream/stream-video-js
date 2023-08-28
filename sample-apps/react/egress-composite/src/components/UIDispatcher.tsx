import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../ConfigurationContext';
import { LayoutType, layoutMap } from './layouts';
import { Spotlight } from './layouts/Spotlight';

const DEFAULT_LAYOUT: LayoutType = 'spotlight';
const DEFAULT_SCREENSHARE_LAYOUT: LayoutType = 'spotlight';

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
