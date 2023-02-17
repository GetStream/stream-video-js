import { ComponentType } from 'react';
import DominantSpeakerLayout from './dominant-speaker';

export type SpotlightMode = 'dominant-speaker' | 'shuffle';
export type LayoutId = 'dominant-speaker';

export interface RequiredProps {
  setVideoElementRef: (ref: HTMLVideoElement | null) => void;
}

export type LayoutComponent<P = {}> = ComponentType<RequiredProps & P>;

export interface Layout {
  SpeakerView: LayoutComponent;
  ScreenShareView: LayoutComponent;
}

const layouts: Record<LayoutId, Layout> = {
  'dominant-speaker': DominantSpeakerLayout,
};

export default layouts;
