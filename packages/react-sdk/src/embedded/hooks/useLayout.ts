import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { PaginatedGridLayout, SpeakerLayout } from '../../core';
import type { LayoutOption } from '../types';
import { useEmbeddedConfiguration } from '../context';

interface LayoutConfig {
  Component: ComponentType<any>;
  props?: Record<string, unknown>;
}

const Layouts: Record<LayoutOption, LayoutConfig> = {
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    props: { groupSize: 16 },
  },
  SpeakerLeft: {
    Component: SpeakerLayout,
    props: { participantsBarPosition: 'left' },
  },
  SpeakerRight: {
    Component: SpeakerLayout,
    props: { participantsBarPosition: 'right' },
  },
  SpeakerTop: {
    Component: SpeakerLayout,
    props: { participantsBarPosition: 'top' },
  },
  SpeakerBottom: {
    Component: SpeakerLayout,
    props: { participantsBarPosition: 'bottom' },
  },
};

const EMPTY_PROPS: Record<string, unknown> = {};
const VALID_LAYOUTS = Object.keys(Layouts) as LayoutOption[];

const isValidLayout = (layout: string): layout is LayoutOption =>
  VALID_LAYOUTS.includes(layout as LayoutOption);

/**
 * Hook to manage layout selection.
 * Returns the layout Component and its props.
 */
export const useLayout = () => {
  const { layout: configuredLayout } = useEmbeddedConfiguration();
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const defaultLayout = isValidLayout(configuredLayout ?? '')
    ? configuredLayout!
    : 'SpeakerBottom';

  const [layout, setLayout] = useState<LayoutOption>(defaultLayout);

  useEffect(() => {
    if (hasScreenShare) {
      setLayout((currentLayout) => {
        if (currentLayout.startsWith('Speaker')) return currentLayout;
        return 'SpeakerRight';
      });
    } else {
      setLayout(defaultLayout);
    }
  }, [hasScreenShare, defaultLayout]);

  const { Component, props = EMPTY_PROPS } = Layouts[layout];

  return { Component, props };
};
