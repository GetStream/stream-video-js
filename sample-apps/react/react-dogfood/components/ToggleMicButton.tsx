import { forwardRef } from 'react';

import {
  Browsers,
  DeviceSelectorAudioInput,
  DeviceSelectorAudioOutput,
  Icon,
  MenuToggle,
  MenuVisualType,
  SfuModels,
  ToggleMenuButtonProps,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-sdk';
import { isMobile } from '../helpers/isMobile';

const ToggleMenuButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  function ToggleMenuButton(props, ref) {
    const { t } = useI18n();
    const { useMicrophoneState, useLocalParticipant } = useCallStateHooks();
    const { selectedDevice: selectedMic, devices: microphones } =
      useMicrophoneState();
    const localParticipant = useLocalParticipant();
    const isSystemMuted = !!localParticipant?.interruptedTracks?.includes(
      SfuModels.TrackType.AUDIO,
    );

    return (
      <button
        ref={ref}
        className="rd__button rd__button--align-left rd__lobby__mic-button"
        title={
          isSystemMuted ? t('Microphone is paused by your system') : undefined
        }
      >
        <Icon className="rd__button__icon" icon="mic" />
        <p className="rd__lobby__mic-button__device">
          {microphones?.find((mic) => mic.deviceId === selectedMic)?.label ||
            t('Default')}
        </p>
        <Icon icon={props.menuShown ? 'chevron-down' : 'chevron-up'} />
      </button>
    );
  },
);

export const ToggleMicButton = () => {
  const { t } = useI18n();
  const inputVisualType =
    isMobile() || Browsers.isSafari() ? 'list' : 'preview';

  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <DeviceSelectorAudioInput
        visualType={inputVisualType}
        title={t('Microphone')}
      />
      <DeviceSelectorAudioOutput visualType="list" title={t('Speaker')} />
    </MenuToggle>
  );
};
