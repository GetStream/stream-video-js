import { ComponentType } from 'react';

import { ConfigurationValue } from '../../ConfigurationContext';
import { DominantSpeaker, DominantSpeakerScreenShare } from './DominantSpeaker';
import { PaginatedGrid } from './PaginatedGrid';
import { Spotlight } from './Spotlight';

export type LayoutType = Exclude<ConfigurationValue['layout'], undefined>;

export const layoutMap: Record<
  LayoutType,
  // normal & screen share view
  [ComponentType, ComponentType] | [ComponentType]
> = {
  single_participant: [DominantSpeaker, DominantSpeakerScreenShare],
  grid: [PaginatedGrid],
  spotlight: [Spotlight, Spotlight],
  mobile: [() => null],
};
