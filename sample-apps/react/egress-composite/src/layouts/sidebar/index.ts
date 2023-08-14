import { GridView } from './GridView';
import { DominantSpeakerScreenShare } from '../fullscreen/DominantSpeakerScreenShare';
import { Layout } from '../index';

export const SidebarLeftLayout: Layout = {
  // TODO: organize this view to have a sidebar with participants on the left side
  ParticipantsView: GridView,
  ScreenShareView: DominantSpeakerScreenShare,
};

export const SidebarRightLayout: Layout = {
  // TODO: organize this view to have a sidebar with participants on the right side
  ParticipantsView: GridView,
  ScreenShareView: DominantSpeakerScreenShare,
};
