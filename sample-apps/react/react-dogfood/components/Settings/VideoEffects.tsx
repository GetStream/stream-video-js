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
import { useAppI18n } from '../../hooks/useAppI18n';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';

const SEGMENTATION_MODEL_OPTIONS: SegmentationModel[] = [
  'selfie_segmenter_landscape',
  'selfie_multiclass_256x256',
  'selfie_segmenter',
];

/**
 * The model names and blurbs used to sit on the options array as `label` / `description` and reach
 * `t()` as runtime values, so neither the key nor the English was visible at the call site. A
 * `switch` over the closed union restores both, and the compiler flags a model added without copy.
 */
const segmentationModelLabel = (
  t: LooseTranslateFunction,
  model: SegmentationModel,
) => {
  switch (model) {
    case 'selfie_segmenter_landscape':
      return t(
        'videoEffects.segmentationModel.landscape.label',
        'Landscape (default)',
      );
    case 'selfie_multiclass_256x256':
      return t('videoEffects.segmentationModel.multiclass.label', 'Multiclass');
    case 'selfie_segmenter':
      return t(
        'videoEffects.segmentationModel.generalPurpose.label',
        'General purpose',
      );
  }
};

const segmentationModelDescription = (
  t: LooseTranslateFunction,
  model: SegmentationModel,
) => {
  switch (model) {
    case 'selfie_segmenter_landscape':
      return t(
        'videoEffects.segmentationModel.landscape.description',
        'Optimized for landscape webcam feeds. Recommended for most video calls.',
      );
    case 'selfie_multiclass_256x256':
      return t(
        'videoEffects.segmentationModel.multiclass.description',
        'Multi-class segmentation with square input (256x256). Higher accuracy but slower.',
      );
    case 'selfie_segmenter':
      return t(
        'videoEffects.segmentationModel.generalPurpose.description',
        'General-purpose segmentation with square input (256x256).',
      );
  }
};

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
  const { t } = useAppI18n();

  const selectedModelIndex =
    SEGMENTATION_MODEL_OPTIONS.indexOf(segmentationModel);
  const selectedModel: SegmentationModel | undefined =
    SEGMENTATION_MODEL_OPTIONS[selectedModelIndex];

  if (!isSupported) {
    return (
      <div className="rd__video-effects">
        <h3>
          {t('videoEffects.unsupportedBrowser.title', 'Unsupported browser')}
        </h3>
        <p>
          {t(
            'videoEffects.unsupportedBrowser.description',
            'Video filters are available only on modern desktop browsers',
          )}
        </p>
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
          <h4>{t('settings.effects.label', 'Effects')}</h4>
          <div className="rd__video-effects__list">
            <CompositeButton
              title={t('videoEffects.disable.title', 'Disable')}
              size="md"
              active={!backgroundFilter}
              onClick={() => disableBackgroundFilter()}
            >
              <Icon icon="close" />
            </CompositeButton>
            <CompositeButton
              title={t('videoEffects.blur.title', 'Blur')}
              size="md"
              className="rd__video-effects__blur--high"
              active={
                backgroundFilter === 'blur' && backgroundBlurLevel === 'high'
              }
              onClick={() => applyBackgroundBlurFilter('high')}
            >
              <Icon icon="blur-icon" />
            </CompositeButton>
            <CompositeButton
              title={t('videoEffects.mediumBlur.title', 'Medium blur')}
              size="md"
              active={
                backgroundFilter === 'blur' && backgroundBlurLevel === 'medium'
              }
              onClick={() => applyBackgroundBlurFilter('medium')}
              className="rd__video-effects__blur--medium"
            >
              <Icon icon="blur-icon" />
            </CompositeButton>
            <CompositeButton
              title={t('videoEffects.lowBlur.title', 'Low blur')}
              size="md"
              active={
                backgroundFilter === 'blur' && backgroundBlurLevel === 'low'
              }
              onClick={() => applyBackgroundBlurFilter('low')}
              className="rd__video-effects__blur--low"
            >
              <Icon icon="blur-icon" />
            </CompositeButton>
          </div>
        </div>
        <div className="rd__video-effects__card">
          <h4>
            {t('videoEffects.segmentationModel.title', 'Segmentation model')}
          </h4>
          <WithTooltip
            title={
              selectedModel
                ? segmentationModelDescription(t, selectedModel)
                : ''
            }
          >
            <DropDownSelect
              defaultSelectedIndex={selectedModelIndex}
              defaultSelectedLabel={
                selectedModel ? segmentationModelLabel(t, selectedModel) : ''
              }
              handleSelect={(index) => {
                const option = SEGMENTATION_MODEL_OPTIONS[index];
                if (option) setSegmentationModel(option);
              }}
            >
              {SEGMENTATION_MODEL_OPTIONS.map((option) => (
                <DropDownSelectOption
                  key={option}
                  label={segmentationModelLabel(t, option)}
                  selected={option === segmentationModel}
                />
              ))}
            </DropDownSelect>
          </WithTooltip>
        </div>
        {backgroundImages && backgroundImages.length > 0 && (
          <div className="rd__video-effects__card">
            <h4>{t('videoEffects.backgrounds.title', 'Backgrounds')}</h4>
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
                    alt={t('videoEffects.background.ariaLabel', 'Background')}
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
