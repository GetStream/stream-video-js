import type { ComponentType } from 'react';
import { PaginatedGridLayout, SpeakerLayout } from '../../core';
import type { LayoutOption } from '../types';

export interface LayoutConfig {
  Component: ComponentType<any>;
  titleKey: string;
  icon: string;
  props?: Record<string, unknown>;
}

/**
 * Available layouts for the embedded client.
 */
export const Layouts: Record<LayoutOption, LayoutConfig> = {
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    titleKey: 'Grid',
    icon: 'grid',
    props: {
      groupSize: 16,
    },
  },
  SpeakerLeft: {
    Component: SpeakerLayout,
    titleKey: 'Speaker (right)',
    icon: 'layout-speaker-right',
    props: { participantsBarPosition: 'left' },
  },
  SpeakerRight: {
    Component: SpeakerLayout,
    titleKey: 'Speaker (left)',
    icon: 'layout-speaker-left',
    props: { participantsBarPosition: 'right' },
  },
  SpeakerTop: {
    Component: SpeakerLayout,
    titleKey: 'Speaker (top)',
    icon: 'layout-speaker-top',
    props: { participantsBarPosition: 'top' },
  },
  SpeakerBottom: {
    Component: SpeakerLayout,
    titleKey: 'Speaker (bottom)',
    icon: 'layout-speaker-bottom',
    props: { participantsBarPosition: 'bottom' },
  },
};

export const DEFAULT_LAYOUT: LayoutOption = 'SpeakerLeft';
