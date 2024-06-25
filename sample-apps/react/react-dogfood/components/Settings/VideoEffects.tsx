import clsx from 'clsx';
import {
  CompositeButton,
  Icon,
  useBackgroundFilters,
  VideoPreview,
} from '@stream-io/video-react-sdk';

export const VideoEffectsSettings = () => {
  const {
    isSupported,
    backgroundImages,
    backgroundBlurLevel,
    backgroundImage,
    backgroundFilter,
    disableBackgroundFilter,
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
  } = useBackgroundFilters();

  if (!isSupported) {
    return (
      <div className="rd__video-effects">
        <h3>Unsupported browser</h3>
        <p>Video filters are available only on modern desktop browsers</p>
      </div>
    );
  }

  return (
    <div className="rd__video-effects">
      <div className="rd__video-effects__preview-container">
        <VideoPreview />
      </div>
      <div className="rd__video-effects__container">
        <div className="rd__video-effects__card">
          <h4>Effects</h4>
          <div className="rd__video-effects__list">
            <CompositeButton
              title="Disable"
              active={!backgroundFilter}
              onClick={() => disableBackgroundFilter()}
            >
              <Icon icon="close" />
            </CompositeButton>
            <CompositeButton
              title="Blur"
              active={
                backgroundFilter === 'blur' && backgroundBlurLevel === 'high'
              }
              onClick={() => applyBackgroundBlurFilter('high')}
            >
              <Icon icon="blur-icon" />
            </CompositeButton>
            <CompositeButton
              title="Medium blur"
              active={
                backgroundFilter === 'blur' && backgroundBlurLevel === 'medium'
              }
              onClick={() => applyBackgroundBlurFilter('medium')}
            >
              <Icon
                icon="blur-icon"
                className="rd__video-effects__blur--medium"
              />
            </CompositeButton>
            <CompositeButton
              title="Low blur"
              active={
                backgroundFilter === 'blur' && backgroundBlurLevel === 'low'
              }
              onClick={() => applyBackgroundBlurFilter('low')}
            >
              <Icon icon="blur-icon" className="rd__video-effects__blur--low" />
            </CompositeButton>
          </div>
        </div>
        {backgroundImages && backgroundImages.length > 0 && (
          <div className="rd__video-effects__card">
            <h4>Backgrounds</h4>
            <div className="rd__video-effects__list">
              {backgroundImages.map((imageUrl) => (
                <div key={imageUrl} className="rd__video-effects__list-box">
                  <img
                    className={clsx(
                      'rd__video-effects__image',
                      backgroundFilter === 'image' &&
                        backgroundImage === imageUrl &&
                        'rd__video-effects__image--active',
                    )}
                    src={imageUrl}
                    alt="Background"
                    onClick={() => applyBackgroundImageFilter(imageUrl)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
