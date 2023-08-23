import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../ConfigurationContext';
import { LayoutType, layoutMap } from './layouts';
import { DominantSpeakerScreenShare } from './layouts/dominant-speaker';
import { PaginatedGrid } from './layouts/grid';

const DEFAULT_LAYOUT: LayoutType = 'grid';
const DEFAULT_SCREENSHARE_LAYOUT: LayoutType = 'single_participant';

export const UIDispatcher = () => {
  const {
    layout = DEFAULT_LAYOUT,
    screenshare_layout = DEFAULT_SCREENSHARE_LAYOUT,
  } = useConfigurationContext();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const DefaultView = layoutMap[layout]?.[0] ?? PaginatedGrid;

  const ScreenShareView =
    layoutMap[screenshare_layout]?.[1] ?? DominantSpeakerScreenShare;

  return hasScreenShare ? <ScreenShareView /> : <DefaultView />;
};
