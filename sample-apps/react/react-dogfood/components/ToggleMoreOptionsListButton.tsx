import { forwardRef, type ReactNode } from 'react';

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
import { useIsProntoEnvironment } from '../context/AppEnvironmentContext';

const ToggleFeedbackButton = forwardRef<HTMLButtonElement>(
  function ToggleFeedbackButtonRender(_, ref) {
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
  function ToggleDevMenuButtonRender(_, ref) {
    const { t } = useI18n();
    return (
      <button ref={ref} className="rd__button rd__more-button">
        <Icon className="rd__button__icon" icon={'developer'} />
        <span> {t('Developer menu')}</span>
      </button>
    );
  },
);

const Menu = ({ controls }: { controls?: ReactNode }) => {
  const isPronto = useIsProntoEnvironment();
  return (
    <ul className="rd__more-menu">
      {controls && (
        <li className="rd__more-menu__item rd__more-menu__controls">
          {controls}
        </li>
      )}
      <li className="rd__more-menu__item">
        <DefaultReactionsMenu reactions={defaultReactions} />
      </li>
      {isPronto && (
        <li className="rd__more-menu__item">
          <MenuToggle
            ToggleButton={ToggleDevMenuButton}
            visualType={MenuVisualType.PORTAL}
          >
            <DevMenu />
          </MenuToggle>
        </li>
      )}

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
>(function ToggleMenuButtonRender(props, ref) {
  return (
    <CompositeButton ref={ref} active={props.menuShown} variant="primary">
      <Icon icon="more" />
    </CompositeButton>
  );
});

/**
 * The mobile "more" menu.
 *
 * @param controls secondary call controls that don't fit the mobile call bar,
 * shown as a row of captioned buttons at the top of the menu.
 */
export const ToggleMoreOptionsListButton = ({
  controls,
}: {
  controls?: ReactNode;
}) => {
  return (
    <MenuToggle placement="top-start" ToggleButton={ToggleMenuButton}>
      <Menu controls={controls} />
    </MenuToggle>
  );
};
