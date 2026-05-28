import { forwardRef } from 'react';

import {
  Browsers,
  DeviceSelectorVideo,
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
    const { useCameraState, useLocalParticipant } = useCallStateHooks();
    const { selectedDevice: selectedCamera, devices: cameras } =
      useCameraState();
    const localParticipant = useLocalParticipant();
    const isSystemMuted = !!localParticipant?.interruptedTracks?.includes(
      SfuModels.TrackType.VIDEO,
    );

    return (
      <button
        ref={ref}
        className="rd__button rd__button--align-left rd__lobby__camera-button"
        title={isSystemMuted ? t('Camera is paused by your system') : undefined}
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
  const visualType = isMobile() || Browsers.isSafari() ? 'list' : 'preview';
  return (
    <MenuToggle
      placement="top-start"
      ToggleButton={ToggleMenuButton}
      visualType={MenuVisualType.MENU}
    >
      <DeviceSelectorVideo visualType={visualType} />
    </MenuToggle>
  );
};
