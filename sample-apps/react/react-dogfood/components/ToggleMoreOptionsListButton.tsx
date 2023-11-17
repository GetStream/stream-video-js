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
import { CallRecordings } from './CallRecordings';

const ToggleFeedbackButton = forwardRef<HTMLButtonElement>((_, ref) => {
  const { t } = useI18n();
  return (
    <button ref={ref} className="str-video__more-button">
      <Icon icon={'feedback'} />
      <span> {t('Feedback')}</span>
    </button>
  );
});

const ToggleRecordLibraryButton = forwardRef<HTMLButtonElement>((_, ref) => {
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
          visualType={MenuVisualType.PORTAL}
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
