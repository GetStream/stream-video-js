import { forwardRef } from 'react';

import {
  DeviceSelectorAudioInput,
  Icon,
  MenuToggle,
  MenuVisualType,
  ToggleMenuButtonProps,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';

export const ToggleMenuButton = forwardRef<
  HTMLButtonElement,
  ToggleMenuButtonProps
>((props, ref) => {
  const { t } = useI18n();
  const { useMicrophoneState } = useCallStateHooks();
  const { selectedDevice: selectedMic, devices: microphones } =
    useMicrophoneState();

  return (
    <button
      ref={ref}
      className="rd__button rd__button--align-left rd__lobby__mic-button"
    >
      <Icon className="rd__button__icon" icon="mic" />
      <p className="rd__lobby__mic-button__device">
        {microphones?.find((mic) => mic.deviceId === selectedMic)?.label ||
          t('Default')}
      </p>
      <Icon icon={props.menuShown ? 'chevron-down' : 'chevron-up'} />
    </button>
  );
});

export const ToggleMicButton = () => {
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <DeviceSelectorAudioInput visualType="list" />
    </MenuToggle>
  );
};
