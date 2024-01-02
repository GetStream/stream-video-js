import { forwardRef } from 'react';
import clsx from 'clsx';

import {
  DeviceSelectorVideo,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  ToggleVideoPublishingButton,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

export const ToggleMenuButton = forwardRef<
  HTMLDivElement,
  ToggleMenuButtonProps
>(function ToggleMenuButton(props, ref) {
  return (
    <div
      ref={ref}
      className={clsx('rd__dual-toggle__device-selector', {
        'rd__dual-toggle__device-selector--active': props.menuShown,
      })}
    >
      <Icon icon={props.menuShown ? 'caret-down' : 'caret-up'} />
    </div>
  );
});

export const ToggleDualCameraButton = () => {
  const { useCameraState } = useCallStateHooks();
  const { status } = useCameraState();
  return (
    <div
      className={clsx('rd__dual-toggle', {
        'rd__dual-toggle--active': status === 'disabled',
      })}
    >
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
