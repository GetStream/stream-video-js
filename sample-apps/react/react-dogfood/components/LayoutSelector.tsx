import { useCallback } from 'react';
import clsx from 'clsx';
import {
  DropDownSelect,
  DropDownSelectOption,
  Icon,
  useCallStateHooks,
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
  return (
    <ul className="rd__layout-selector__list">
      {(Object.keys(LayoutMap) as Array<keyof typeof LayoutMap>)
        .filter((key) => !canScreenshare(key))
        .map((key) => (
          <li key={key} className="rd__layout-selector__item">
            <button
              className={clsx('rd__button rd__button--align-left', {
                'rd__button--primary': key === selectedLayout,
              })}
              onClick={() =>
                handleSelect(Object.keys(LayoutMap).findIndex((k) => k === key))
              }
            >
              <Icon className="rd__button__icon" icon={LayoutMap[key].icon} />
              {LayoutMap[key].title}
            </button>
          </li>
        ))}
    </ul>
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
          <DropDownSelectOption
            key={key}
            selected={key === selectedLayout}
            label={LayoutMap[key].title}
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
