import { forwardRef } from 'react';

import {
  CompositeButton,
  Icon,
  IconButton,
  MenuToggle,
  MenuVisualType,
  useI18n,
} from '@stream-io/video-react-sdk';

import { Feedback } from './Feedback/Feedback';
import { DevMenu } from './DevMenu';

const ToggleFeedbackButton = forwardRef<HTMLButtonElement>((_, ref) => {
  const { t } = useI18n();
  return (
    <button ref={ref} className="rd__button str-video__more-button">
      <Icon className="rd__button__icon" icon={'feedback'} />
      <span> {t('Feedback')}</span>
    </button>
  );
});

const ToggleDevMenuButton = forwardRef<HTMLButtonElement>((_, ref) => {
  const { t } = useI18n();
  return (
    <button ref={ref} className="rd__button str-video__more-button">
      <Icon className="rd__button__icon" icon={'developer'} />
      <span> {t('Developer menu')}</span>
    </button>
  );
});

const Menu = () => {
  const { t } = useI18n();
  return (
    <ul className="str-video__more-menu">
      <li className="strt-video__more-option--record-library">
        <MenuToggle
          ToggleButton={ToggleDevMenuButton}
          visualType={MenuVisualType.PORTAL}
        >
          <DevMenu />
        </MenuToggle>
      </li>

      <li className="str-video__more-option--feedback">
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

export const ToggleMenuButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <CompositeButton>
      <IconButton ref={ref} icon="more" />
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
