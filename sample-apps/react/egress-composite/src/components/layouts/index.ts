import { ComponentType } from 'react';
import { PaginatedGrid } from './grid/PaginatedGrid';
import { DominantSpeaker } from './dominant-speaker/DominantSpeaker';
import { DominantSpeakerScreenShare } from './dominant-speaker';

export type LayoutType = 'dominant_speaker' | 'grid' | 'spotlight';

export const layoutMap: Record<
  LayoutType,
  // normal & screen share view
  [ComponentType, ComponentType] | [ComponentType]
> = {
  dominant_speaker: [DominantSpeaker, DominantSpeakerScreenShare],
  grid: [PaginatedGrid],
  spotlight: [() => null],
};
