import { ComponentType } from 'react';
import FullscreenLayout from './fullscreen';
import GridLayout from './grid';
import {SidebarLeftLayout, SidebarRightLayout} from "./sidebar";

export const DEFAULT_LAYOUT_ID: LayoutId = 'grid';

export type LayoutId = 'fullscreen' | 'grid' | 'sidebar_right' | 'sidebar_left';

export interface Layout {
  ParticipantsView: ComponentType;
  ScreenShareView: ComponentType;
}

const layouts: Record<LayoutId, Layout> = {
  'fullscreen': FullscreenLayout,
  'sidebar_right': SidebarLeftLayout,
  'sidebar_left': SidebarRightLayout,
  grid: GridLayout,
};

export default layouts;
