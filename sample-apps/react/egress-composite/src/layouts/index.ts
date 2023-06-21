import { ComponentType } from 'react';
import DominantSpeakerLayout from './dominant-speaker';
import GridLayout from './grid';

export const DEFAULT_LAYOUT_ID: LayoutType = 'grid';

export type SpotlightMode = 'dominant-speaker' | 'shuffle';
export type LayoutType = 'dominant-speaker' | 'grid';

export interface LayoutPair {
  DefaultView: ComponentType;
  ScreenShareView: ComponentType;
}

const layoutPairMap: Record<LayoutType, LayoutPair> = {
  'dominant-speaker': DominantSpeakerLayout,
  grid: GridLayout,
};

export default layoutPairMap;
