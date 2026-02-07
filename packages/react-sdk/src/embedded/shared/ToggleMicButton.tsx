import { forwardRef } from 'react';

import { useCallStateHooks } from '@stream-io/video-react-bindings';
import {
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '../../components';
import { MicMenu } from './index';

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleMenuButton(props, ref) {
    const { useMicrophoneState } = useCallStateHooks();
    const { selectedDevice: selectedMic, devices: microphones } =
      useMicrophoneState();

    return (
      <button ref={ref} className="str-video__embedded-lobby__device-button">
        <Icon
          className="str-video__embedded-lobby__device-button-icon"
          icon="mic"
        />
        <span className="str-video__embedded-lobby__device-button-label">
          {microphones?.find((m: MediaDeviceInfo) => m.deviceId === selectedMic)
            ?.label || 'Default'}
        </span>
        <Icon icon={props.menuShown ? 'chevron-down' : 'chevron-up'} />
      </button>
    );
  },
);

export const ToggleMicButton = () => {
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <MicMenu />
    </MenuToggle>
  );
};
