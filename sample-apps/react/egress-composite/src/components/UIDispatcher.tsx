import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../ConfigurationContext';
import {
  DEFAULT_LAYOUT,
  DEFAULT_SCREENSHARE_LAYOUT,
  layoutMap,
} from './layouts';
import { Spotlight } from './layouts/Spotlight';

export const UIDispatcher = () => {
  const { layout, screenshare_layout } = useConfigurationContext();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const DefaultView = layoutMap[layout ?? DEFAULT_LAYOUT]?.[0] ?? Spotlight;
  const ScreenShareView =
    layoutMap[
      screenshare_layout ?? layout ?? DEFAULT_SCREENSHARE_LAYOUT
    ]?.[1] ?? Spotlight;

  return hasScreenShare ? <ScreenShareView /> : <DefaultView />;
};
