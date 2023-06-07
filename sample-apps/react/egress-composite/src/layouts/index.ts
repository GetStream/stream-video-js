import { ComponentType } from 'react';
import DominantSpeakerLayout from './dominant-speaker';
import GridLayout from './grid';

export const DEFAULT_LAYOUT_ID: LayoutId = 'grid';

export type SpotlightMode = 'dominant-speaker' | 'shuffle';
export type LayoutId = 'dominant-speaker' | 'grid';

export interface Layout {
  ParticipantsView: ComponentType;
  ScreenShareView: ComponentType;
}

const layouts: Record<LayoutId, Layout> = {
  'dominant-speaker': DominantSpeakerLayout,
  grid: GridLayout,
};

export default layouts;
