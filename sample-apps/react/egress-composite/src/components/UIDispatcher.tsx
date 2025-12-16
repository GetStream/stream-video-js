import { useCallStateHooks } from '@stream-io/video-react-sdk';

import { useConfigurationContext } from '../ConfigurationContext';
import {
  DEFAULT_LAYOUT,
  DEFAULT_SCREENSHARE_LAYOUT,
  layoutMap,
} from './layouts';
import { Spotlight } from './layouts/Spotlight';
import { useFirstMatchingLayoutOverride } from './CustomActionsContext';

export const UIDispatcher = () => {
  const { layout, screenshare_layout } = useConfigurationContext();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const { layoutOverride, layoutOverrideCustomAction } =
    useFirstMatchingLayoutOverride();

  const DefaultView =
    layoutOverride?.[0] ??
    layoutMap[layout ?? DEFAULT_LAYOUT]?.[0] ??
    Spotlight;
  const ScreenShareView =
    layoutOverride?.[1] ??
    layoutMap[
      screenshare_layout ?? layout ?? DEFAULT_SCREENSHARE_LAYOUT
    ]?.[1] ??
    Spotlight;

  return hasScreenShare && !layoutOverrideCustomAction?.ignore_screenshare ? (
    <ScreenShareView />
  ) : (
    <DefaultView />
  );
};
