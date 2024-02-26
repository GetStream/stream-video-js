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
        <h2 className="rd__documentation-button__heading">
          {t(
            'Faster and more reliable video calls, livestreams and audio rooms.',
          )}
        </h2>
        <p className="rd__documentation-button__description">
          {t(
            'Excellent developer experience and docs enable you to build in-app video calling in days. Scale to millions of users and thousands of call participants.',
          )}
        </p>
        <div className="rd__documentation-button__actions">
          <a
            className="rd__button rd__button--secondary rd__button--align-left"
            href="https://getstream.io/video/docs/"
            target="_blank"
            rel="noreferrer"
          >
            <Icon className="rd__button__icon" icon="folder" />
            {t('Documentation')}
          </a>

          <a
            className="rd__button rd__button--primary rd__button--align-left"
            href="https://getstream.io/video/#contact"
            target="_blank"
            rel="noreferrer"
          >
            <Icon className="rd__button__icon" icon="support-agent" />
            {t('Contact an expert')}
          </a>
        </div>
      </div>
    </MenuToggle>
  );
};
