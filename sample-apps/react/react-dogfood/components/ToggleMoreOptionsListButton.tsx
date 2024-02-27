import { forwardRef } from 'react';

import {
  CompositeButton,
  defaultReactions,
  DefaultReactionsMenu,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useI18n,
} from '@stream-io/video-react-sdk';

import { Feedback } from './Feedback/Feedback';
import { DevMenu } from './DevMenu';

const ToggleFeedbackButton = forwardRef<HTMLButtonElement>(
  function ToggleFeedbackButton(_, ref) {
    const { t } = useI18n();
    return (
      <button ref={ref} className="rd__button rd__more-button">
        <Icon className="rd__button__icon" icon={'feedback'} />
        <span> {t('Feedback')}</span>
      </button>
    );
  },
);

const ToggleDevMenuButton = forwardRef<HTMLButtonElement>(
  function ToggleDevMenuButton(_, ref) {
    const { t } = useI18n();
    return (
      <button ref={ref} className="rd__button rd__more-button">
        <Icon className="rd__button__icon" icon={'developer'} />
        <span> {t('Developer menu')}</span>
      </button>
    );
  },
);

const Menu = () => {
  return (
    <ul className="rd__more-menu">
      <li className="rd__more-menu__item">
        <DefaultReactionsMenu reactions={defaultReactions} />
      </li>
      <li className="rd__more-menu__item">
        <MenuToggle
          ToggleButton={ToggleDevMenuButton}
          visualType={MenuVisualType.PORTAL}
        >
          <DevMenu />
        </MenuToggle>
      </li>

      <li className="rd__more-menu__item">
        <MenuToggle
          ToggleButton={ToggleFeedbackButton}
          visualType={MenuVisualType.PORTAL}
        >
          <Feedback />
        </MenuToggle>
      </li>
    </ul>
  );
};

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleMenuButton(props, ref) {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <Icon icon="more" />
    </CompositeButton>
  );
});

export const ToggleMoreOptionsListButton = () => {
  return (
    <MenuToggle placement="top-start" ToggleButton={ToggleMenuButton}>
      <Menu />
    </MenuToggle>
  );
};
