import { ComponentType } from 'react';
import { PaginatedGrid } from './grid/PaginatedGrid';
import { DominantSpeaker } from './dominant-speaker/DominantSpeaker';
import { DominantSpeakerScreenShare } from './dominant-speaker';
import { ConfigurationValue } from '../../ConfigurationContext';

export type LayoutType = Exclude<ConfigurationValue['layout'], undefined>;

export const layoutMap: Record<
  LayoutType,
  // normal & screen share view
  [ComponentType, ComponentType] | [ComponentType]
> = {
  single_participant: [DominantSpeaker, DominantSpeakerScreenShare],
  grid: [PaginatedGrid],
  spotlight: [() => null],
  mobile: [() => null],
};
