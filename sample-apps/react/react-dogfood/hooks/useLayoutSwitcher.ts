import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
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

/**
 * The layouts offered by the layout switcher.
 *
 * The human-readable name is deliberately absent: it used to live here as `title`, which
 * `LayoutSelector` then fed straight into `t()` — a translation key built from a runtime value.
 * The names are now literal `t()` calls in `layoutLabel()` next to that component.
 */
export const LayoutMap = {
  LegacyGrid: {
    Component: CallParticipantsView,
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
    icon: 'grid',
  },
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    icon: 'layout',
    props: {
      groupSize: 16,
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  SpeakerBottom: {
    Component: SpeakerLayout,
    icon: 'layout-speaker-top',
    props: {
      enableDragToScroll: true,
      participantsBarPosition: 'bottom',
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
    },
  },
  SpeakerTop: {
    Component: SpeakerLayout,
    icon: 'layout-speaker-bottom',
    props: {
      enableDragToScroll: true,
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
      participantsBarPosition: 'top',
    },
  },
  SpeakerRight: {
    Component: SpeakerLayout,
    icon: 'layout-speaker-left',
    props: {
      enableDragToScroll: true,
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
      participantsBarPosition: 'right',
    },
  },
  SpeakerLeft: {
    Component: SpeakerLayout,
    icon: 'layout-speaker-right',
    props: {
      enableDragToScroll: true,
      participantsBarPosition: 'left',
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
    },
  },
  LegacySpeaker: {
    Component: CallParticipantsScreenView,
    icon: 'layout',
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  SpeakerOneOnOne: {
    Component: SpeakerOneOnOne,
    icon: 'layout-speaker-one-on-one',
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  LivestreamLayout: {
    Component: LivestreamLayout,
    icon: 'layout-speaker-live-stream',
    props: {},
  },
};

const SETTINGS_KEY = '@pronto/layout-settings';
const DEFAULT_LAYOUT: keyof typeof LayoutMap = 'SpeakerLeft';

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
  const router = useRouter();
  const layoutOverride = router.query['layout'] as
    keyof typeof LayoutMap | undefined;

  const [layout, setLayout] = useState<keyof typeof LayoutMap>(() => {
    const layoutToUse =
      layoutOverride || getLayoutSettings()?.selectedLayout || DEFAULT_LAYOUT;
    return LayoutMap[layoutToUse] ? layoutToUse : DEFAULT_LAYOUT;
  });

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  useEffect(() => {
    // always switch to screen-share compatible layout
    if (hasScreenShare) {
      return setLayout((currentLayout) => {
        if (currentLayout.startsWith('Speaker')) return currentLayout;
        return 'SpeakerRight';
      });
    }

    const storedLayout =
      layoutOverride ?? getLayoutSettings()?.selectedLayout ?? DEFAULT_LAYOUT;
    const isStoredLayoutInMap = LayoutMap[storedLayout];
    setLayout(
      // reset to "stored" layout, use default if incompatible layout is used
      storedLayout === 'LegacySpeaker' || !isStoredLayoutInMap
        ? DEFAULT_LAYOUT
        : storedLayout,
    );
  }, [hasScreenShare, layoutOverride]);

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
