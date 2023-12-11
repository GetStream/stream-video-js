import { forwardRef } from 'react';
import clsx from 'clsx';

import {
  Icon,
  DeviceSelectorAudioInput,
  ToggleMenuButtonProps,
  ToggleAudioPublishingButton,
  MenuToggle,
  MenuVisualType,
} from '@stream-io/video-react-sdk';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>((props, ref) => {
  return (
    <div
      ref={ref}
      className={clsx('rd__dual-toggle__device-selector', {
        'rd__dual-toggle__device-selector--active': props.menuShown,
      })}
    >
      <Icon icon={props.menuShown ? 'chevron-down' : 'chevron-up'} />
    </div>
  );
});

export const ToggleDualMicButton = () => {
  return (
    <div className="rd__dual-toggle">
      <ToggleAudioPublishingButton />
      <MenuToggle
        placement="top"
        ToggleButton={ToggleMenuButton}
        visualType={MenuVisualType.MENU}
      >
        <DeviceSelectorAudioInput visualType="list" title={undefined} />
      </MenuToggle>
    </div>
  );
};
