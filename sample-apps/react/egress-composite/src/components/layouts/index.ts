import { ComponentType } from 'react';

import { DominantSpeaker, DominantSpeakerScreenShare } from './DominantSpeaker';
import { PaginatedGrid } from './PaginatedGrid';
import { Spotlight } from './Spotlight';

export const DEFAULT_LAYOUT: Layout = 'spotlight';
export const DEFAULT_SCREENSHARE_LAYOUT: ScreenshareLayout = 'spotlight';

export type Layout = 'grid' | 'single-participant' | 'spotlight' | 'mobile';
// NOTE: should always be a subset of the Layout type
export type ScreenshareLayout = 'single-participant' | 'spotlight';

export const layoutMap: Record<
  Layout,
  // normal & screen share view
  [ComponentType, ComponentType] | [ComponentType]
> = {
  'single-participant': [DominantSpeaker, DominantSpeakerScreenShare],
  grid: [PaginatedGrid],
  spotlight: [Spotlight, Spotlight],
  mobile: [() => null],
};
