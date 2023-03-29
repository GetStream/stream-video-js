import { useEffect, forwardRef } from 'react';
import {
  PaginatedGridLayout,
  CallParticipantsView,
  SpeakerLayout,
  CallParticipantsScreenView,
  GenericMenu,
  GenericMenuButtonItem,
  MenuToggle,
  IconButton,
  ToggleMenuButtonProps,
  useHasOngoingScreenShare,
} from '@stream-io/video-react-sdk';

export const LayoutMap = {
  PaginatedGrid: {
    Component: PaginatedGridLayout,
    title: 'Paginated grid layout (beta)',
  },
  LegacyGrid: {
    Component: CallParticipantsView,
    title: 'Grid layout',
  },
  Speaker: {
    Component: SpeakerLayout,
    title: 'Speaker layout (beta)',
  },
  LegacySpeaker: {
    Component: CallParticipantsScreenView,
    title: 'Screen-share layout',
  },
};

export const LayoutSelector = ({
  onMenuItemClick: setLayout,
}: {
  onMenuItemClick: (key: keyof typeof LayoutMap) => void;
}) => {
  const hasScreenShare = useHasOngoingScreenShare();

  useEffect(() => {
    if (hasScreenShare) return setLayout('LegacySpeaker');

    setLayout('LegacyGrid');
  }, [hasScreenShare, setLayout]);

  return (
    <MenuToggle placement="bottom-end" ToggleButton={LayoutSelectorButton}>
      <Menu onItemClick={setLayout} />
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
  onItemClick: setLayout,
}: {
  onItemClick: (key: keyof typeof LayoutMap) => void;
}) => {
  const hasScreenShare = useHasOngoingScreenShare();

  return (
    <GenericMenu>
      {(Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>).map((key) => (
        <GenericMenuButtonItem
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
