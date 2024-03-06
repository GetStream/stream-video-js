import { forwardRef } from 'react';

import {
  DeviceSelectorVideo,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleMenuButton(props, ref) {
    const { t } = useI18n();
    const { useCameraState } = useCallStateHooks();
    const { selectedDevice: selectedCamera, devices: cameras } =
      useCameraState();

    return (
      <button
        ref={ref}
        className="rd__button rd__button--align-left rd__lobby__camera-button"
      >
        <Icon className="rd__button__icon" icon="camera" />
        <p className="rd__lobby__camera-button__device">
          {cameras?.find((camera) => camera.deviceId === selectedCamera)
            ?.label || t('Default')}
        </p>
        <Icon icon={props.menuShown ? 'chevron-down' : 'chevron-up'} />
      </button>
    );
  },
);

export const ToggleCameraButton = () => {
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <DeviceSelectorVideo visualType="list" />
    </MenuToggle>
  );
};
