import clsx from 'clsx';
import {
  CompositeButton,
  DropDownSelect,
  DropDownSelectOption,
  Icon,
  useBackgroundFilters,
  VideoPreview,
  WithTooltip,
} from '@stream-io/video-react-sdk';
import { useSettings } from '../../context/SettingsContext';
import { SegmentationModel } from '../../context/SettingsContext';

const SEGMENTATION_MODEL_OPTIONS: {
  value: SegmentationModel;
  label: string;
  description: string;
}[] = [
  {
    value: 'selfie_segmenter_landscape',
    label: 'Landscape (default)',
    description:
      'Optimized for landscape webcam feeds. Recommended for most video calls.',
  },
  {
    value: 'selfie_multiclass_256x256',
    label: 'Multiclass',
    description:
      'Multi-class segmentation with square input (256x256). Higher accuracy but slower.',
  },
  {
    value: 'selfie_segmenter',
    label: 'General purpose',
    description: 'General-purpose segmentation with square input (256x256).',
  },
];

export const VideoEffectsSettings = () => {
  const {
    isLoading,
    isSupported,
    backgroundImages,
    backgroundBlurLevel,
    backgroundImage,
    backgroundFilter,
    disableBackgroundFilter,
    applyBackgroundBlurFilter,
    applyBackgroundImageFilter,
  } = useBackgroundFilters();

  const {
    settings: { segmentationModel, setSegmentationModel },
  } = useSettings();

  const selectedModelIndex = SEGMENTATION_MODEL_OPTIONS.findIndex(
    (model) => model.value === segmentationModel,
  );
  const defaultModel = SEGMENTATION_MODEL_OPTIONS.find(
    (model) => model.value === 'selfie_segmenter_landscape',
  )!;
  const selectedModel =
    SEGMENTATION_MODEL_OPTIONS[selectedModelIndex] ?? defaultModel;

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
        {isLoading && (
          <div className="rd__video-effects__progress-bar">
            <div className="rd__video-effects__progress-bar__fill" />
          </div>
        )}
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
        <div className="rd__video-effects__card">
          <h4>Segmentation model</h4>
          <WithTooltip title={selectedModel?.description}>
            <DropDownSelect
              defaultSelectedIndex={selectedModelIndex}
              defaultSelectedLabel={selectedModel?.label}
              handleSelect={(index) => {
                setSegmentationModel(SEGMENTATION_MODEL_OPTIONS[index]?.value);
              }}
            >
              {SEGMENTATION_MODEL_OPTIONS.map((option) => (
                <DropDownSelectOption
                  key={option?.value}
                  label={option?.label}
                  selected={option?.value === segmentationModel}
                />
              ))}
            </DropDownSelect>
          </WithTooltip>
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
