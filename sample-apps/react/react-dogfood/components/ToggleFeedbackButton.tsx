import { forwardRef } from 'react';

import {
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '@stream-io/video-react-sdk';

import { Feedback } from './Feedback/Feedback';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>((props, ref) => {
  return (
    <CompositeButton ref={ref} active={props.menuShown} activeVariant="primary">
      <IconButton icon="feedback" />
    </CompositeButton>
  );
});

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
