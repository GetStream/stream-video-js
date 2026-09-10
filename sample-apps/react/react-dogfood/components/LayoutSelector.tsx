import { useCallback } from 'react';
import {
  DropDownSelect,
  DropDownSelectOption,
  GenericMenu,
  GenericMenuButtonItem,
  Icon,
  useCallStateHooks,
  useI18n,
  useMenuContext,
} from '@stream-io/video-react-sdk';
import { LayoutMap } from '../hooks';

export enum LayoutSelectorType {
  LIST = 'list',
  DROPDOWN = 'menu',
}

export type LayoutSelectorProps = {
  onMenuItemClick: (newLayout: keyof typeof LayoutMap) => void;
  selectedLayout: keyof typeof LayoutMap;
  visualType?: LayoutSelectorType;
};

export const LayoutSelector = ({
  onMenuItemClick: setLayout,
  selectedLayout,
  visualType,
}: LayoutSelectorProps) => {
  return (
    <Menu
      onMenuItemClick={setLayout}
      selectedLayout={selectedLayout}
      visualType={visualType}
    />
  );
};

const ListMenu = ({
  selectedLayout,
  handleSelect,
  canScreenshare,
}: LayoutSelectorProps & {
  handleSelect: (index: number) => void;
  canScreenshare: (key: string) => boolean;
}) => {
  const { close } = useMenuContext();
  const { t } = useI18n();
  return (
    <GenericMenu>
      {(Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>)
        .filter((key) => !canScreenshare(key))
        .map((key) => (
          <GenericMenuButtonItem
            key={key}
            type="button"
            aria-current={key === selectedLayout}
            onClick={() => {
              handleSelect(Object.keys(LayoutMap).findIndex((k) => k === key));
              close?.();
            }}
          >
            <Icon icon={LayoutMap[key].icon} />
            {t(LayoutMap[key].title)}
          </GenericMenuButtonItem>
        ))}
    </GenericMenu>
  );
};

const DropdownMenu = ({
  selectedLayout,
  handleSelect,
  canScreenshare,
}: LayoutSelectorProps & {
  handleSelect: (index: number) => void;
  canScreenshare: (key: string) => boolean;
}) => {
  const { t } = useI18n();
  return (
    <DropDownSelect
      icon={LayoutMap[selectedLayout].icon || 'grid'}
      defaultSelectedIndex={Object.keys(LayoutMap).findIndex(
        (k) => k === selectedLayout,
      )}
      defaultSelectedLabel={t(LayoutMap[selectedLayout].title)}
      handleSelect={handleSelect}
    >
      {(Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>)
        .filter((key) => !canScreenshare(key))
        .map((key) => (
          <DropDownSelectOption
            key={key}
            selected={key === selectedLayout}
            label={t(LayoutMap[key].title)}
            icon={LayoutMap[key].icon}
          />
        ))}
    </DropDownSelect>
  );
};

const Menu = ({
  onMenuItemClick: setLayout,
  selectedLayout,
  visualType = LayoutSelectorType.DROPDOWN,
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
      }
    },
    [setLayout],
  );

  if (visualType === LayoutSelectorType.LIST) {
    return (
      <ListMenu
        onMenuItemClick={setLayout}
        selectedLayout={selectedLayout}
        canScreenshare={canScreenshare}
        handleSelect={handleSelect}
      />
    );
  }

  return (
    <DropdownMenu
      onMenuItemClick={setLayout}
      selectedLayout={selectedLayout}
      canScreenshare={canScreenshare}
      handleSelect={handleSelect}
    />
  );
};
