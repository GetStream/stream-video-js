import { useCallback } from 'react';
import { useCallStateHooks } from '@stream-io/video-react-bindings';
import { useI18n } from '../../../i18n';
import {
  Button,
  DeviceSelectorVideo,
  Icon,
  useBackgroundFilters,
} from '../../../components';

export const BlurToggleButton = () => {
  const { t } = useI18n();
  const { useCameraState } = useCallStateHooks();
  const { isMute } = useCameraState();

  const {
    isSupported,
    isReady,
    isLoading,
    backgroundFilter,
    applyBackgroundBlurFilter,
    disableBackgroundFilter,
  } = useBackgroundFilters();

  const isBlurred = backgroundFilter === 'blur';
  const isDisabled = !isReady || isLoading || isMute;

  const handleClick = useCallback(() => {
    if (isDisabled) return;

    if (isBlurred) {
      disableBackgroundFilter();
    } else {
      applyBackgroundBlurFilter('high');
    }
  }, [
    applyBackgroundBlurFilter,
    disableBackgroundFilter,
    isBlurred,
    isDisabled,
  ]);

  const getLabel = () => {
    if (isLoading)
      return t('callControls.blurToggleButton.applying.label', 'Applying...');
    return isBlurred
      ? t('callControls.blurToggleButton.disableBlur.label', 'Disable blur')
      : t(
          'callControls.blurToggleButton.blurBackground.label',
          'Blur background',
        );
  };

  if (!isSupported) return null;

  return (
    <Button
      variant="secondary"
      appearance="outline"
      size="sm"
      className="str-video__embedded-blur-toggle"
      disabled={isDisabled}
      active={isBlurred}
      onClick={handleClick}
    >
      <Icon icon="blur-icon" />
      <span>{getLabel()}</span>
    </Button>
  );
};

export const CameraMenuWithBlur = () => {
  return (
    <>
      <DeviceSelectorVideo visualType="list" />
      <div className="str-video__embedded-blur-toggle-container">
        <BlurToggleButton />
      </div>
    </>
  );
};
