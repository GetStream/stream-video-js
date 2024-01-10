import { forwardRef } from 'react';

import {
  Icon,
  CompositeButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useI18n,
} from '@stream-io/video-react-sdk';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleMenuButton(props, ref) {
  return (
    <CompositeButton
      className="rd__documentation-button"
      ref={ref}
      active={props.menuShown}
      variant="primary"
    >
      <Icon icon="caret-down" />
    </CompositeButton>
  );
});

export const ToggleDocumentationButton = () => {
  const { t } = useI18n();
  return (
    <MenuToggle
      placement="bottom-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <div className="rd__documentation-button__menu">
        <a
          className="rd__button rd__button--align-left"
          href="https://getstream.io/video/sdk/react/"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__button__icon" icon="mediation" />
          {t('Tutorials')}
        </a>
        <a
          className="rd__button rd__button--align-left"
          href="https://getstream.io/video/docs/"
          target="_blank"
          rel="noreferrer"
        >
          <Icon className="rd__button__icon" icon="folder" />
          {t('Documentation')}
        </a>
      </div>
    </MenuToggle>
  );
};
