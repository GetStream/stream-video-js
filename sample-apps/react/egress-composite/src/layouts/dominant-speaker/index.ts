import { DominantSpeaker } from './DominantSpeaker';
import { DominantSpeakerScreenShare } from './DominantSpeakerScreenShare';
import { type LayoutPair } from '../index';

const DominantSpeakerLayout: LayoutPair = {
  DefaultView: DominantSpeaker,
  ScreenShareView: DominantSpeakerScreenShare,
};

export default DominantSpeakerLayout;
