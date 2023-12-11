import { forwardRef } from 'react';
import clsx from 'clsx';

import {
  Icon,
  DeviceSelectorVideo,
  ToggleMenuButtonProps,
  ToggleVideoPublishingButton,
} from '@stream-io/video-react-sdk';

import { MenuToggle, MenuVisualType } from '@stream-io/video-react-sdk';

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

export const ToggleDualCameraButton = () => {
  return (
    <div className="rd__dual-toggle">
      <ToggleVideoPublishingButton />
      <MenuToggle
        placement="top"
        ToggleButton={ToggleMenuButton}
        visualType={MenuVisualType.MENU}
      >
        <DeviceSelectorVideo visualType="list" />
      </MenuToggle>
    </div>
  );
};
