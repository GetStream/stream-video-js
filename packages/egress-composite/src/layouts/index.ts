import { ComponentType } from 'react';
import DominantSpeakerLayout from './dominant-speaker';
import GridLayout from './grid';

export const DEFAULT_LAYOUT_ID: LayoutId = 'dominant-speaker';

export type SpotlightMode = 'dominant-speaker' | 'shuffle';
export type LayoutId = 'dominant-speaker' | 'grid';

export interface RequiredProps {
  setVideoElementRef: (ref: HTMLVideoElement | null) => void;
}

export type LayoutComponent<P = {}> = ComponentType<RequiredProps & P>;

export interface Layout {
  ParticipantsView: LayoutComponent;
  ScreenShareView: LayoutComponent;
}

const layouts: Record<LayoutId, Layout> = {
  [DEFAULT_LAYOUT_ID]: DominantSpeakerLayout,
  grid: GridLayout,
};

export default layouts;
