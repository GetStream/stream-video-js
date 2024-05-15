import { forwardRef } from 'react';

import {
  CompositeButton,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  WithTooltip,
  useI18n,
} from '@stream-io/video-react-sdk';

import { Feedback } from './Feedback/Feedback';

const ToggleMenuButton = forwardRef<HTMLDivElement, ToggleMenuButtonProps>(
  function ToggleMenuButton(props, ref) {
    const { t } = useI18n();
    return (
      <WithTooltip title={t('Feedback')}>
        <CompositeButton ref={ref} active={props.menuShown} variant="primary">
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
