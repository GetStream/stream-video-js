import { forwardRef } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
} from '@stream-io/video-react-sdk';

import { Feedback } from './Feedback/Feedback';
import { useAppI18n } from '../hooks/useAppI18n';

const ToggleMenuButton = forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
  function ToggleMenuButtonRender(props, ref) {
    const { t } = useAppI18n();
    return (
      <WithTooltip title={t('feedback.feedback.label', 'Feedback')}>
        <CompositeButton ref={ref} active={props.menuShown}>
          <Icon icon="feedback" />
        </CompositeButton>
      </WithTooltip>
    );
  },
);

export const ToggleFeedbackButton = () => {
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.PORTAL}
    >
      <Feedback />
    </MenuToggle>
  );
};
