import { PaginatedGridLayout, SpeakerLayout } from '@stream-io/video-react-sdk';

/**
 * Available layouts for the embedded app.
 */
export const Layouts = {
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Grid',
    icon: 'grid',
    props: {
      groupSize: 16,
    },
  },
  SpeakerLeft: {
    Component: SpeakerLayout,
    title: 'Speaker (right)',
    icon: 'layout-speaker-right',
    props: { participantsBarPosition: 'left' as const },
  },
  SpeakerRight: {
    Component: SpeakerLayout,
    title: 'Speaker (left)',
    icon: 'layout-speaker-left',
    props: { participantsBarPosition: 'right' as const },
  },
  SpeakerTop: {
    Component: SpeakerLayout,
    title: 'Speaker (bottom)',
    icon: 'layout-speaker-bottom',
    props: { participantsBarPosition: 'top' as const },
  },
  SpeakerBottom: {
    Component: SpeakerLayout,
    title: 'Speaker (top)',
    icon: 'layout-speaker-top',
    props: { participantsBarPosition: 'bottom' as const },
  },
};

export type LayoutKey = keyof typeof Layouts;

export const DEFAULT_LAYOUT: LayoutKey = 'SpeakerLeft';

export const isLayoutKey = (key: string | undefined): key is LayoutKey => {
  return key !== undefined && key in Layouts;
};
