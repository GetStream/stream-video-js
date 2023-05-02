import { forwardRef, useEffect } from 'react';
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
  },
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Grid (beta)',
  },
  Speaker: {
    Component: SpeakerLayout,
    title: 'Spotlight (beta)',
  },
  LegacySpeaker: {
    Component: CallParticipantsScreenView,
    title: 'Sidebar',
  },
};

export type LayoutSelectorProps = {
  onMenuItemClick: (key: keyof typeof LayoutMap) => void;
  selectedLayout: keyof typeof LayoutMap;
};

const SETTINGS_KEY = '@pronto/layout-settings';
export const DEFAULT_LAYOUT = 'Speaker';

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
    // always switch to screen-share compatible layout
    if (hasScreenShare) return setLayout('Speaker');

    setLayout(
      // reset to "stored" layout, use default if uncompatible layout is used
      storedLayout === 'LegacySpeaker' ? DEFAULT_LAYOUT : storedLayout,
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
