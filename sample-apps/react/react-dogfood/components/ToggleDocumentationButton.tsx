import { forwardRef } from 'react';

import {
  Icon,
  CompositeButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '@stream-io/video-react-sdk';
import { useAppI18n } from '../hooks/useAppI18n';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleMenuButtonRender(props, ref) {
  return (
    <CompositeButton
      className="rd__documentation-button"
      ref={ref}
      active={props.menuShown}
      size="sm"
    >
      <Icon icon="caret-down" />
    </CompositeButton>
  );
});

export const ToggleDocumentationButton = () => {
  const { t } = useAppI18n();
  return (
    <MenuToggle
      placement="bottom-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <div className="rd__documentation-button__menu">
        <h2 className="rd__documentation-button__heading">
          {t(
            'documentation.tagline.text',
            'Faster and more reliable video calls, livestreams and audio rooms.',
          )}
        </h2>
        <p className="rd__documentation-button__description">
          {t(
            'documentation.pitch.text',
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
            {t('common.documentation.label', 'Documentation')}
          </a>

          <a
            className="rd__button rd__button--primary rd__button--align-left"
            href="https://getstream.io/video/#contact"
            target="_blank"
            rel="noreferrer"
          >
            <Icon className="rd__button__icon" icon="support-agent" />
            {t('common.contactAnExpert.label', 'Contact an expert')}
          </a>
        </div>
      </div>
    </MenuToggle>
  );
};
