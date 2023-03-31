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
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Grid (beta)',
  },
  Speaker: {
    Component: SpeakerLayout,
    title: 'Spotlight (beta)',
  },
  LegacyGrid: {
    Component: CallParticipantsView,
    title: 'Grid',
  },
  LegacySpeaker: {
    Component: CallParticipantsScreenView,
    title: 'Screen-share',
  },
};

type LayoutSelectorProps = {
  onMenuItemClick: (key: keyof typeof LayoutMap) => void;
  selectedLayout: keyof typeof LayoutMap;
};

export const LayoutSelector = ({
  onMenuItemClick: setLayout,
  selectedLayout,
}: LayoutSelectorProps) => {
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    if (hasScreenShare) return setLayout('LegacySpeaker');

    setLayout('LegacyGrid');
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
          onClick={() => setLayout(key)}
          key={key}
        >
          {LayoutMap[key].title}
        </GenericMenuButtonItem>
      ))}
    </GenericMenu>
  );
};
