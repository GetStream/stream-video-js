import { Dispatch, SetStateAction, useEffect, useCallback } from 'react';
import {
  LivestreamLayout,
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
  DropDownSelect,
  Icon,
} from '@stream-io/video-react-sdk';

import {
  CallParticipantsScreenView,
  CallParticipantsView,
  SpeakerOneOnOne,
} from './CallLayout';

export const LayoutMap = {
  LegacyGrid: {
    Component: CallParticipantsView,
    title: 'Grid (legacy)',
    props: {},
  },
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Paginated grid',
    props: {
      groupSize: 16,
    },
  },
  SpeakerBottom: {
    Component: SpeakerLayout,
    title: 'Spotlight (default)',
    props: {
      participantsBarPosition: 'bottom',
    },
  },
  SpeakerRight: {
    Component: SpeakerLayout,
    title: 'Spotlight (bar right)',
    props: {
      participantsBarPosition: 'right',
    },
  },
  SpeakerTop: {
    Component: SpeakerLayout,
    title: 'Spotlight (bar top)',
    props: {
      participantsBarPosition: 'top',
    },
  },
  SpeakerLeft: {
    Component: SpeakerLayout,
    title: 'Spotlight (bar left)',
    props: {
      participantsBarPosition: 'left',
    },
  },
  LegacySpeaker: {
    Component: CallParticipantsScreenView,
    title: 'Sidebar',
    props: {},
  },
  SpeakerOneOnOne: {
    Component: SpeakerOneOnOne,
    title: 'Speaker 1:1',
    props: {},
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

  const handleSelect = useCallback((index: number) => {
    //setLayout(key);
    //localStorage.setItem(SETTINGS_KEY, JSON.stringify({ selectedLayout: key }));
  }, []);

  return (
    <DropDownSelect
      icon="grid"
      defaultSelectedIndex={Object.keys(LayoutMap).findIndex(
        (k) => k === selectedLayout,
      )}
      defaultSelectedLabel={LayoutMap[selectedLayout].title}
      handleSelect={handleSelect}
    >
      {(Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>).map((key) => (
        <div className="">
          <Icon className="" icon="grid" />
          <span key={key}>{LayoutMap[key].title}</span>
        </div>
      ))}
    </DropDownSelect>
  );
};
