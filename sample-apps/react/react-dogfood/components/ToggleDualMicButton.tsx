import { forwardRef } from 'react';
import clsx from 'clsx';

import {
  DeviceSelectorAudioInput,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleAudioPublishingButton,
  ToggleMenuButtonProps,
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

export const ToggleDualMicButton = () => {
  const { useMicrophoneState } = useCallStateHooks();
  const { status } = useMicrophoneState();

  return (
    <div
      className={clsx('rd__dual-toggle', {
        'rd__dual-toggle--active': status === 'disabled',
      })}
    >
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
