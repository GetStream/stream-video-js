import type {
  INoiseCancellation,
  NoiseCancellationOptions,
} from '@stream-io/audio-filters-web';

export type NoiseCancellationModel =
  | 'auto'
  | 'krisp'
  | 'fastenhancer-tiny'
  | 'fastenhancer-base'
  | 'fastenhancer-small'
  | 'mol';

export const NOISE_CANCELLATION_MODELS: NoiseCancellationModel[] = [
  'auto',
  'krisp',
  'fastenhancer-tiny',
  'fastenhancer-base',
  'fastenhancer-small',
  'mol',
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
const getNoiseCancellationOptions = (
  model: NoiseCancellationModel,
): NoiseCancellationOptions => {
  switch (model) {
    case 'krisp':
      return {
        defaultEngine: 'krisp',
        // Krisp reports Safari as unsupported unless opted in;
        // its SDK still requires Safari 17.4+.
        withSafariSupport: true,
        // the model is the SDK default (small) if the call picks `stream`
        fastEnhancer: { basePath: fastEnhancerBasePath },
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
        // the model is the SDK default (small) if the call picks `stream`
        fastEnhancer: { basePath: fastEnhancerBasePath },
      };
  }
};

/**
 * Creates the noise cancellation for the model picked in the settings.
 * `mol` runs this app's own model build (see noise-cancellation/README.md)
 * whatever the call settings pick; the others go through the SDK's
 * `NoiseCancellation` router.
 */
export const createNoiseCancellation = async (
  model: NoiseCancellationModel,
): Promise<INoiseCancellation> => {
  if (model === 'mol') {
    const { MolNoiseCancellation } =
      await import('../noise-cancellation/MolNoiseCancellation');
    return new MolNoiseCancellation({
      basePath: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/noise-cancellation`,
    });
  }
  const { NoiseCancellation } = await import('@stream-io/audio-filters-web');
  return new NoiseCancellation(getNoiseCancellationOptions(model));
};
