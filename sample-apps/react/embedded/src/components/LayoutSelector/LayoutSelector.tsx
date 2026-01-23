import { useCallback } from 'react';
import {
  DropDownSelect,
  DropDownSelectOption,
  Icon,
  useCallStateHooks,
  useMenuContext,
} from '@stream-io/video-react-sdk';

import { Layouts, LayoutKey } from '../../layouts/LayoutMap';

export enum LayoutSelectorType {
  LIST = 'list',
  DROPDOWN = 'menu',
}

export type LayoutSelectorProps = {
  onMenuItemClick: (newLayout: LayoutKey) => void;
  selectedLayout: LayoutKey;
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
  shouldHide,
}: LayoutSelectorProps & {
  handleSelect: (index: number) => void;
  shouldHide: (key: string) => boolean;
}) => {
  const { close } = useMenuContext();
  return (
    <ul className="rd__layout-selector__list">
      {(Object.keys(Layouts) as Array<LayoutKey>)
        .filter((key) => !shouldHide(key))
        .map((key) => (
          <li key={key} className="rd__layout-selector__item">
            <button
              className={`rd__button rd__button--align-left${key === selectedLayout ? ' rd__button--primary' : ''}`}
              onClick={() => {
                handleSelect(Object.keys(Layouts).findIndex((k) => k === key));
                close?.();
              }}
            >
              <Icon className="rd__button__icon" icon={Layouts[key].icon} />
              {Layouts[key].title}
            </button>
          </li>
        ))}
    </ul>
  );
};

const DropdownMenu = ({
  selectedLayout,
  handleSelect,
  shouldHide,
}: LayoutSelectorProps & {
  handleSelect: (index: number) => void;
  shouldHide: (key: string) => boolean;
}) => {
  return (
    <DropDownSelect
      icon={Layouts[selectedLayout]?.icon || 'grid'}
      defaultSelectedIndex={Object.keys(Layouts).findIndex(
        (k) => k === selectedLayout,
      )}
      defaultSelectedLabel={Layouts[selectedLayout]?.title || ''}
      handleSelect={handleSelect}
    >
      {(Object.keys(Layouts) as Array<LayoutKey>)
        .filter((key) => !shouldHide(key))
        .map((key) => (
          <DropDownSelectOption
            key={key}
            selected={key === selectedLayout}
            label={Layouts[key].title}
            icon={Layouts[key].icon}
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

  // Hide grid layouts during screen share (they don't display screen share well)
  const shouldHide = (key: string) => hasScreenShare && key === 'PaginatedGrid';

  const handleSelect = useCallback(
    (index: number) => {
      const layout: LayoutKey | undefined = (
        Object.keys(Layouts) as Array<LayoutKey>
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
        shouldHide={shouldHide}
        handleSelect={handleSelect}
      />
    );
  }

  return (
    <DropdownMenu
      onMenuItemClick={setLayout}
      selectedLayout={selectedLayout}
      shouldHide={shouldHide}
      handleSelect={handleSelect}
    />
  );
};
