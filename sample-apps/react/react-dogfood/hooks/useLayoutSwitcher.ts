import { useCallback, useEffect, useState } from 'react';
import {
  LivestreamLayout,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import {
  CallParticipantsScreenView,
  CallParticipantsView,
  SpeakerOneOnOne,
} from '../components/CallLayout';
import { DebugParticipantViewUI } from '../components/Debug/DebugParticipantViewUI';

export const LayoutMap = {
  LegacyGrid: {
    Component: CallParticipantsView,
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
    title: 'Default',
    icon: 'grid',
  },
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Grid',
    icon: 'layout',
    props: {
      groupSize: 16,
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  SpeakerBottom: {
    Component: SpeakerLayout,
    title: 'Speaker [top]',
    icon: 'layout-speaker-top',
    props: {
      participantsBarPosition: 'bottom',
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
    },
  },
  SpeakerTop: {
    Component: SpeakerLayout,
    title: 'Speaker [bottom]',
    icon: 'layout-speaker-bottom',
    props: {
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
      participantsBarPosition: 'top',
    },
  },
  SpeakerRight: {
    Component: SpeakerLayout,
    title: 'Speaker [left]',
    icon: 'layout-speaker-left',
    props: {
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
      participantsBarPosition: 'right',
    },
  },
  SpeakerLeft: {
    Component: SpeakerLayout,
    title: 'Speaker [right]',
    icon: 'layout-speaker-right',
    props: {
      participantsBarPosition: 'left',
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
    },
  },
  LegacySpeaker: {
    Component: CallParticipantsScreenView,
    icon: 'layout',
    title: 'Sidebar',
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  SpeakerOneOnOne: {
    Component: SpeakerOneOnOne,
    icon: 'layout-speaker-one-on-one',
    title: 'Speaker 1:1',
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  LivestreamLayout: {
    Component: LivestreamLayout,
    title: 'Livestream',
    icon: 'layout-speaker-live-stream',
    props: {},
  },
};

const SETTINGS_KEY = '@pronto/layout-settings';
const DEFAULT_LAYOUT: keyof typeof LayoutMap = 'SpeakerBottom';

export const getLayoutSettings = () => {
  if (typeof window === 'undefined') return;
  const settings = window.localStorage.getItem(SETTINGS_KEY);
  if (settings) {
    try {
      return JSON.parse(settings) as { selectedLayout: keyof typeof LayoutMap };
    } catch (e) {
      console.log('Error parsing layout settings', e);
    }
  }
};

export const useLayoutSwitcher = () => {
  const [layout, setLayout] = useState<keyof typeof LayoutMap>(() => {
    const storedLayout = getLayoutSettings()?.selectedLayout;
    if (!storedLayout) return DEFAULT_LAYOUT;
    return Object.hasOwn(LayoutMap, storedLayout)
      ? storedLayout
      : DEFAULT_LAYOUT;
  });

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  useEffect(() => {
    // always switch to screen-share compatible layout
    if (hasScreenShare) {
      return setLayout((currentLayout) => {
        if (currentLayout.startsWith('Speaker')) return currentLayout;
        return 'SpeakerBottom';
      });
    }

    const storedLayout = getLayoutSettings()?.selectedLayout ?? DEFAULT_LAYOUT;
    const isStoredLayoutInMap = Object.hasOwn(LayoutMap, storedLayout);
    setLayout(
      // reset to "stored" layout, use default if incompatible layout is used
      storedLayout === 'LegacySpeaker' || !isStoredLayoutInMap
        ? DEFAULT_LAYOUT
        : storedLayout,
    );
  }, [hasScreenShare]);

  const switchLayout = useCallback((newLayout: keyof typeof LayoutMap) => {
    setLayout(newLayout);
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ selectedLayout: newLayout }),
    );
  }, []);

  return {
    layout,
    setLayout: switchLayout,
  };
};
