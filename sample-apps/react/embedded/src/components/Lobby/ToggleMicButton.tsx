import { forwardRef } from 'react';

import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleMenuButton(props, ref) {
    const { useMicrophoneState } = useCallStateHooks();
    const { selectedDevice: selectedMic, devices: microphones } =
      useMicrophoneState();

    return (
      <button ref={ref} className="rd__lobby-device-button">
        <Icon className="rd__lobby-device-button__icon" icon="mic" />
        <span className="rd__lobby-device-button__label">
          {microphones?.find((mic) => mic.deviceId === selectedMic)?.label ||
            'Default'}
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
      <DeviceSelectorAudioOutput visualType="list" title="Speaker" />
      <DeviceSelectorAudioInput visualType="list" title="Microphone" />
    </MenuToggle>
  );
};
