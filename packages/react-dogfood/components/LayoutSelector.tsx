import { Dispatch, SetStateAction, forwardRef, useEffect } from 'react';
import {
  CallParticipantsScreenView,
  CallParticipantsView,
  GenericMenu,
  GenericMenuButtonItem,
  IconButton,
  MenuToggle,
  PaginatedGridLayout,
  SpeakerLayout,
  ToggleMenuButtonProps,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-sdk';

export const LayoutMap = {
  LegacyGrid: {
    Component: CallParticipantsView,
    title: 'Grid',
    props: {},
  },
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Grid (beta)',
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
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    const storedLayout = getLayoutSettings()?.selectedLayout ?? DEFAULT_LAYOUT;

    const isStoredLayoutInMap = Object.hasOwn(LayoutMap, storedLayout);

    // always switch to screen-share compatible layout
    if (hasScreenShare)
      return setLayout((currentLayout) => {
        if (currentLayout.startsWith('Speaker') && isStoredLayoutInMap)
          return currentLayout;
        return 'SpeakerBottom';
      });

    setLayout(
      // reset to "stored" layout, use default if incompatible layout is used
      storedLayout === 'LegacySpeaker' || !isStoredLayoutInMap
        ? DEFAULT_LAYOUT
        : storedLayout,
    );
  }, [hasScreenShare, setLayout]);

  return (
    <MenuToggle placement="bottom-end" ToggleButton={LayoutSelectorButton}>
      <Menu onMenuItemClick={setLayout} selectedLayout={selectedLayout} />
    </MenuToggle>
  );
};

const LayoutSelectorButton = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>((props, ref) => (
  <IconButton enabled={props.menuShown} icon="grid" ref={ref} />
));

const Menu = ({
  onMenuItemClick: setLayout,
  selectedLayout,
}: LayoutSelectorProps) => {
  const hasScreenShare = useHasOngoingScreenShare();

  return (
    <GenericMenu>
      {(Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>).map((key) => (
        <GenericMenuButtonItem
          aria-selected={key === selectedLayout}
          disabled={
            (hasScreenShare &&
              (key === 'LegacyGrid' || key === 'PaginatedGrid')) ||
            (!hasScreenShare && key === 'LegacySpeaker')
          }
          onClick={() => {
            setLayout(key);
            localStorage.setItem(
              SETTINGS_KEY,
              JSON.stringify({ selectedLayout: key }),
            );
          }}
          key={key}
        >
          {LayoutMap[key].title}
        </GenericMenuButtonItem>
      ))}
    </GenericMenu>
  );
};
