import { useCallback } from 'react';
import clsx from 'clsx';
import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import {
  DropDownSelect,
  DropDownSelectOption,
  Icon,
  useMenuContext,
} from '../../../../components';

import { Layouts } from '../../../layouts';
import type { LayoutOption } from '../../../types';

export enum LayoutSelectorType {
  LIST = 'list',
  DROPDOWN = 'menu',
}

export type LayoutSelectorProps = {
  onMenuItemClick: (newLayout: LayoutOption) => void;
  selectedLayout: LayoutOption;
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
  const { t } = useI18n();
  const { close } = useMenuContext();
  return (
    <ul className="str-video__embedded-layout-selector__list">
      {(Object.keys(Layouts) as Array<LayoutOption>)
        .filter((key) => !shouldHide(key))
        .map((key) => (
          <li key={key} className="str-video__embedded-layout-selector__item">
            <button
              className={clsx(
                'str-video__embedded-button str-video__embedded-button--align-left',
                {
                  'str-video__embedded-button--primary': key === selectedLayout,
                },
              )}
              onClick={() => {
                handleSelect(Object.keys(Layouts).findIndex((k) => k === key));
                close?.();
              }}
            >
              <Icon
                className="str-video__embedded-button__icon"
                icon={Layouts[key].icon}
              />
              {t(Layouts[key].titleKey)}
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
  const { t } = useI18n();
  return (
    <DropDownSelect
      icon={Layouts[selectedLayout]?.icon || 'grid'}
      defaultSelectedIndex={Object.keys(Layouts).findIndex(
        (k) => k === selectedLayout,
      )}
      defaultSelectedLabel={t(Layouts[selectedLayout]?.titleKey || '')}
      handleSelect={handleSelect}
    >
      {(Object.keys(Layouts) as Array<LayoutOption>)
        .filter((key) => !shouldHide(key))
        .map((key) => (
          <DropDownSelectOption
            key={key}
            selected={key === selectedLayout}
            label={t(Layouts[key].titleKey)}
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

  const shouldHide = (key: string) => hasScreenShare && key === 'PaginatedGrid';

  const handleSelect = useCallback(
    (index: number) => {
      const layout: LayoutOption | undefined = (
        Object.keys(Layouts) as Array<LayoutOption>
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
