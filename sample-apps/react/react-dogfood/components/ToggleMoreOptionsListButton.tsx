import { forwardRef } from 'react';
import clsx from 'clsx';

import {
  ButtonWithIconProps,
  CompositeButton,
  IconButton,
  Icon,
  useI18n,
  MenuToggle,
} from '@stream-io/video-react-sdk';

import { Feedback } from './Feedback/Feedback';
import { CallRecordings } from './CallRecordings';

export type ToggleMoreOptionsListButtonProps = { caption?: string } & Omit<
  ButtonWithIconProps,
  'icon' | 'ref'
>;

export type ToggleOptionButtonProps = { icon: string; label: string };

const ToggleFeedbackButton = forwardRef<
  HTMLButtonElement,
  ToggleOptionButtonProps
>((_, ref) => {
  const { t } = useI18n();

  return (
    <button ref={ref} className="str-video__more-button">
      <Icon icon={'feedback'} />
      <span> {t('Feedback')}</span>
    </button>
  );
});

const ToggleRecordLibraryButton = forwardRef<
  HTMLButtonElement,
  ToggleOptionButtonProps
>((_, ref) => {
  const { t } = useI18n();

  return (
    <button ref={ref} className="str-video__more-button">
      <Icon icon={'film-roll'} />
      <span> {t('Record library')}</span>
    </button>
  );
});

const Menu = () => {
  const { t } = useI18n();
  return (
    <ul className="str-video__more-menu">
      <li className="strt-video__more-option--record-library">
        <MenuToggle
          ToggleButton={ToggleRecordLibraryButton}
          visualType="portal"
        >
          <CallRecordings />
        </MenuToggle>
      </li>

      <li className="str-video__more-option--screen-share">
        <div className="str-video__more-link">
          <Icon icon="screen-share-off" />
          {t('Share screen')}
        </div>
      </li>
      <li className="str-video__more-option--feedback">
        <MenuToggle ToggleButton={ToggleFeedbackButton} visualType="portal">
          <Feedback />
        </MenuToggle>
      </li>
    </ul>
  );
};

export const ToggleMenuButton = forwardRef<
  HTMLButtonElement,
  ToggleMoreOptionsListButtonProps
>((props, ref) => {
  const { enabled, caption } = props;
  return (
    <CompositeButton active={enabled} caption={caption}>
      <IconButton ref={ref} icon="more" {...props} />
    </CompositeButton>
  );
});

export const ToggleMoreOptionsListButton = (
  props: ToggleMoreOptionsListButtonProps,
) => {
  return (
    <MenuToggle placement="top-start" ToggleButton={ToggleMenuButton}>
      <Menu />
    </MenuToggle>
  );
};
