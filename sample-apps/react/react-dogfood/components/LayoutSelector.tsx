import { Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import {
  LivestreamLayout,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  DropDownSelect,
  DefaultDropDownSelectOption,
} from '@stream-io/video-react-sdk';

import {
  CallParticipantsScreenView,
  CallParticipantsView,
  SpeakerOneOnOne,
} from './CallLayout';
import { DebugParticipantViewUI } from './Debug/DebugParticipantViewUI';

export const LayoutMap = {
  LegacyGrid: {
    Component: CallParticipantsView,
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
    title: 'Default',
  },
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Grid',
    props: {
      groupSize: 16,
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  SpeakerBottom: {
    Component: SpeakerLayout,
    title: 'Speaker [top]',
    props: {
      participantsBarPosition: 'bottom',
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
    },
  },
  SpeakerTop: {
    Component: SpeakerLayout,
    title: 'Speaker [bottom]',
    props: {
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
      participantsBarPosition: 'top',
    },
  },
  SpeakerRight: {
    Component: SpeakerLayout,
    title: 'Speaker [left]',
    props: {
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
      participantsBarPosition: 'right',
    },
  },
  SpeakerLeft: {
    Component: SpeakerLayout,
    title: 'Speaker [right]',
    props: {
      participantsBarPosition: 'left',
      ParticipantViewUIBar: DebugParticipantViewUI,
      ParticipantViewUISpotlight: DebugParticipantViewUI,
    },
  },
  LegacySpeaker: {
    Component: CallParticipantsScreenView,
    title: 'Sidebar',
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  SpeakerOneOnOne: {
    Component: SpeakerOneOnOne,
    title: 'Speaker 1:1',
    props: {
      ParticipantViewUI: DebugParticipantViewUI,
    },
  },
  LivestreamLayout: {
    Component: LivestreamLayout,
    title: 'Livestream',
    props: {},
  },
};

export type LayoutSelectorProps = {
  onMenuItemClick: Dispatch<SetStateAction<keyof typeof LayoutMap>>;
  selectedLayout: keyof typeof LayoutMap;
};

const SETTINGS_KEY = '@pronto/layout-settings';
export const DEFAULT_LAYOUT: keyof typeof LayoutMap = 'SpeakerBottom';

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

export const LayoutSelector = ({
  onMenuItemClick: setLayout,
  selectedLayout,
}: LayoutSelectorProps) => {
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    const storedLayout = getLayoutSettings()?.selectedLayout ?? DEFAULT_LAYOUT;

    const isStoredLayoutInMap = Object.hasOwn(LayoutMap, storedLayout);

    // always switch to screen-share compatible layout
    if (hasScreenShare)
      return setLayout((currentLayout) => {
        if (currentLayout.startsWith('Speaker')) return currentLayout;
        return 'SpeakerBottom';
      });

    setLayout(
      // reset to "stored" layout, use default if incompatible layout is used
      storedLayout === 'LegacySpeaker' || !isStoredLayoutInMap
        ? DEFAULT_LAYOUT
        : storedLayout,
    );
  }, [hasScreenShare, setLayout]);

  return <Menu onMenuItemClick={setLayout} selectedLayout={selectedLayout} />;
};

const Menu = ({
  onMenuItemClick: setLayout,
  selectedLayout,
}: LayoutSelectorProps) => {
  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();

  const canScreenshare = (key: string) =>
    (hasScreenShare && (key === 'LegacyGrid' || key === 'PaginatedGrid')) ||
    (!hasScreenShare && key === 'LegacySpeaker');

  const handleSelect = useCallback(
    (index: number) => {
      const layout: keyof typeof LayoutMap | undefined = (
        Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>
      ).find((_, k) => k === index);

      if (layout) {
        setLayout(layout);
        localStorage.setItem(
          SETTINGS_KEY,
          JSON.stringify({ selectedLayout: layout }),
        );
      }
    },
    [setLayout],
  );

  return (
    <DropDownSelect
      icon="grid"
      defaultSelectedIndex={Object.keys(LayoutMap).findIndex(
        (k) => k === selectedLayout,
      )}
      defaultSelectedLabel={LayoutMap[selectedLayout].title}
      handleSelect={handleSelect}
    >
      {(Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>)
        .filter((key) => !canScreenshare(key))
        .map((key) => (
          <DefaultDropDownSelectOption
            key={key}
            selected={key === selectedLayout}
            label={LayoutMap[key].title}
            icon="grid"
          />
        ))}
    </DropDownSelect>
  );
};
