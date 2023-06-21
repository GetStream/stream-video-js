import { GridView } from './GridView';
import { DominantSpeakerScreenShare } from '../dominant-speaker/DominantSpeakerScreenShare';
import { type LayoutPair } from '../index';

const GridLayout: LayoutPair = {
  DefaultView: GridView,
  // reuses the screen share view from dominant speaker layout
  ScreenShareView: DominantSpeakerScreenShare,
};

export default GridLayout;
