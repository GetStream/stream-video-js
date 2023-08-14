import { GridView } from './GridView';
import { DominantSpeakerScreenShare } from '../fullscreen/DominantSpeakerScreenShare';
import { Layout } from '../index';

const GridLayout: Layout = {
  ParticipantsView: GridView,
  ScreenShareView: DominantSpeakerScreenShare,
};

export default GridLayout;
