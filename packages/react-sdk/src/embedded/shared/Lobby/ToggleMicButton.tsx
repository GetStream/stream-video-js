import { forwardRef } from 'react';

import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import {
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
} from '../../../components';

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
  const { t } = useI18n();

  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <>
        <DeviceSelectorAudioOutput visualType="list" title={t('Speaker')} />
        <DeviceSelectorAudioInput visualType="list" title={t('Microphone')} />
      </>
    </MenuToggle>
  );
};
