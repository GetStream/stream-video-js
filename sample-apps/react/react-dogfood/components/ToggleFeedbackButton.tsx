import { forwardRef } from 'react';

import {
  CompositeButton,
  IconButton,
  MenuToggle,
  MenuVisualType,
} from '@stream-io/video-react-sdk';

import { Feedback } from './Feedback/Feedback';

export const ToggleMenuButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <CompositeButton>
      <IconButton ref={ref} icon="feedback" />
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
