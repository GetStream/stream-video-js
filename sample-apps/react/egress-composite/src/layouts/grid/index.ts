import { GridView } from './GridView';
import { DominantSpeakerScreenShare } from '../dominant-speaker/DominantSpeakerScreenShare';
import { Layout } from '../index';

const GridLayout: Layout = {
  ParticipantsView: GridView,
  // reuses the screen share view from dominant speaker layout
  ScreenShareView: DominantSpeakerScreenShare,
};

export default GridLayout;
