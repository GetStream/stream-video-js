import { forwardRef } from 'react';

import { useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '../../components';
import { CameraMenuWithBlur } from '../shared';

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleMenuButton(props, ref) {
    const { useCameraState } = useCallStateHooks();
    const { selectedDevice: selectedCamera, devices: cameras } =
      useCameraState();

    return (
      <button ref={ref} className="str-video__embedded-lobby-device-button">
        <Icon
          className="str-video__embedded-lobby-device-button__icon"
          icon="camera"
        />
        <span className="str-video__embedded-lobby-device-button__label">
          {cameras?.find((c: MediaDeviceInfo) => c.deviceId === selectedCamera)
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
      <CameraMenuWithBlur />
    </MenuToggle>
  );
};
