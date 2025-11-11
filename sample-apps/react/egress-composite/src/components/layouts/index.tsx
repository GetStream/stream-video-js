import { ComponentType } from 'react';

import { DominantSpeaker, DominantSpeakerScreenShare } from './DominantSpeaker';
import { PaginatedGrid } from './PaginatedGrid';
import { Spotlight } from './Spotlight';

// NOTE: with the current setup of the app, using this layout breaks in DEV mode.
// The reason for it seems to be yarn and how `workspace:^` versions are resolved.
// This app and the skool layout package both depend on `@stream-io/video-react-sdk`
// and this causes some resolution conflict internally.
//
// The production builds don't seem to be affected, and we have a workaround for dev.
// The workaround is to modify the egress-composite/package.json with
// `"@stream-io/video-react-sdk": "x.y.z"` (where x.y.z) is the previously released version
// e.g.: current: 1.25.1 -> x.y.z should be 1.25.0
import { SkoolStreamLayout } from '@skooldev/skool-stream-layout';

export const DEFAULT_LAYOUT: Layout = 'spotlight';
export const DEFAULT_SCREENSHARE_LAYOUT: ScreenshareLayout = 'spotlight';

export type Layout =
  | 'grid'
  | 'single-participant'
  | 'spotlight'
  | 'mobile'
  | 'dominant-speaker'
  // custom layouts
  | 'skool';

// NOTE: should always be a subset of the Layout type
export type ScreenshareLayout =
  | 'single-participant'
  | 'spotlight'
  | 'dominant-speaker'
  // custom layouts
  | 'skool';

const CustomSkoolStreamLayout = () => {
  return <SkoolStreamLayout excludeLocalParticipant />;
};

export const layoutMap: Record<
  Layout,
  // normal & screen share view
  [ComponentType, ComponentType] | [ComponentType]
> = {
  'single-participant': [DominantSpeaker, DominantSpeakerScreenShare],
  'dominant-speaker': [DominantSpeaker, DominantSpeakerScreenShare],
  mobile: [DominantSpeaker, DominantSpeakerScreenShare],
  grid: [PaginatedGrid],
  spotlight: [Spotlight, Spotlight],

  // custom layouts
  skool: [CustomSkoolStreamLayout, CustomSkoolStreamLayout],
};
