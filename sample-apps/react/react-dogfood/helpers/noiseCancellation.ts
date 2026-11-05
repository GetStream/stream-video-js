import type { INoiseCancellation } from '@stream-io/audio-filters-web';

export type NoiseCancellationModel =
  'krisp' | 'fastenhancer-tiny' | 'fastenhancer-base' | 'fastenhancer-small';

export const NOISE_CANCELLATION_MODELS: NoiseCancellationModel[] = [
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

export const createNoiseCancellation = async (
  model: NoiseCancellationModel,
): Promise<INoiseCancellation> => {
  const { NoiseCancellation, FastEnhancerNoiseCancellation } =
    await import('@stream-io/audio-filters-web');
  console.info('[dogfood] noise cancellation model:', model);
  switch (model) {
    case 'fastenhancer-tiny':
      return new FastEnhancerNoiseCancellation({
        model: 'tiny',
        basePath: fastEnhancerBasePath,
      });
    case 'fastenhancer-base':
      return new FastEnhancerNoiseCancellation({
        model: 'base',
        basePath: fastEnhancerBasePath,
      });
    case 'fastenhancer-small':
      return new FastEnhancerNoiseCancellation({
        model: 'small',
        basePath: fastEnhancerBasePath,
      });
    case 'krisp':
    default:
      // Krisp reports Safari as unsupported unless opted in;
      // its SDK still requires Safari 17.4+.
      return new NoiseCancellation({ withSafariSupport: true });
  }
};
