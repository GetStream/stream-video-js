import { useCallStateHooks, useI18n } from '@stream-io/video-react-bindings';
import {
  DeviceSelectorVideo,
  Icon,
  useBackgroundFilters,
} from '../../../components';
import { useCallback } from 'react';

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
    if (isLoading) return t('Applying...');
    return isBlurred ? t('Disable blur') : t('Blur background');
  };

  if (!isSupported) return null;

  return (
    <button
      type="button"
      className={`str-video__embedded-blur-toggle ${isBlurred ? 'str-video__embedded-blur-toggle--active' : ''}`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      <Icon icon="blur-icon" />
      <span>{getLabel()}</span>
    </button>
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
