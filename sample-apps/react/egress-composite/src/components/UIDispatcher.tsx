import { useCallStateHooks } from '@stream-io/video-react-sdk';
import { useConfigurationContext } from '../ConfigurationContext';
import { LayoutType, layoutMap } from './layouts';
import { DominantSpeakerScreenShare } from './layouts/dominant-speaker';
import { PaginatedGrid } from './layouts/grid';

const DEFAULT_MAIN_LAYOUT: LayoutType = 'grid';
const DEFAULT_SCREENSHARE_LAYOUT: LayoutType = 'dominant_speaker';

export const UIDispatcher = () => {
  const {
    options: {
      layout: {
        main = DEFAULT_MAIN_LAYOUT,
        screenshare = DEFAULT_SCREENSHARE_LAYOUT,
      } = {},
    },
  } = useConfigurationContext();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const DefaultView = layoutMap[main]?.[0] ?? PaginatedGrid;

  const ScreenShareView =
    layoutMap[screenshare]?.[1] ?? DominantSpeakerScreenShare;

  return hasScreenShare ? <ScreenShareView /> : <DefaultView />;
};
