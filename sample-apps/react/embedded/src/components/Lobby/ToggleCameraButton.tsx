import { forwardRef } from 'react';

import {
  DeviceSelectorVideo,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleMenuButton(props, ref) {
    const { useCameraState } = useCallStateHooks();
    const { selectedDevice: selectedCamera, devices: cameras } =
      useCameraState();

    return (
      <button ref={ref} className="rd__lobby-device-button">
        <Icon className="rd__lobby-device-button__icon" icon="camera" />
        <span className="rd__lobby-device-button__label">
          {cameras?.find((camera) => camera.deviceId === selectedCamera)
            ?.label || 'Default'}
        </span>
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
