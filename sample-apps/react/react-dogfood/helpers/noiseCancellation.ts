import type { NoiseCancellationOptions } from '@stream-io/audio-filters-web';

export type NoiseCancellationModel =
  | 'auto'
  | 'krisp'
  | 'fastenhancer-tiny'
  | 'fastenhancer-base'
  | 'fastenhancer-small';

export const NOISE_CANCELLATION_MODELS: NoiseCancellationModel[] = [
  'auto',
  'krisp',
  'fastenhancer-tiny',
  'fastenhancer-base',
  'fastenhancer-small',
];

/**
 * The FastEnhancer models are served by this app, see
 * scripts/copy-fastenhancer-models.mjs.
 */
const fastEnhancerBasePath = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/fastenhancer/models`;

/**
 * Maps the model picked in the settings to the options of the
 * `NoiseCancellation` router. The pick is a hint: it applies when the call
 * settings (`extra_opts.noise_cancellation.engine`) don't select an engine.
 */
export const getNoiseCancellationOptions = (
  model: NoiseCancellationModel,
): NoiseCancellationOptions => {
  switch (model) {
    case 'krisp':
      return {
        defaultEngine: 'krisp',
        // Krisp reports Safari as unsupported unless opted in;
        // its SDK still requires Safari 17.4+.
        withSafariSupport: true,
        fastEnhancer: { model: 'base', basePath: fastEnhancerBasePath },
      };
    case 'fastenhancer-tiny':
    case 'fastenhancer-base':
    case 'fastenhancer-small':
      return {
        defaultEngine: 'stream',
        fastEnhancer: {
          model:
            model === 'fastenhancer-tiny'
              ? 'tiny'
              : model === 'fastenhancer-small'
                ? 'small'
                : 'base',
          basePath: fastEnhancerBasePath,
        },
      };
    case 'auto':
    default:
      return {
        fastEnhancer: { model: 'base', basePath: fastEnhancerBasePath },
      };
  }
};
