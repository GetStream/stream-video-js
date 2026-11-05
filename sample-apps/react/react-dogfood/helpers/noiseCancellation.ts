import type { INoiseCancellation } from '@stream-io/audio-filters-web';

export type NoiseCancellationModel =
  'krisp' | 'fastenhancer-tiny' | 'fastenhancer-base' | 'fastenhancer-small';

export const NOISE_CANCELLATION_MODELS: NoiseCancellationModel[] = [
  'krisp',
  'fastenhancer-tiny',
  'fastenhancer-base',
  'fastenhancer-small',
];

export const createNoiseCancellation = async (
  model: NoiseCancellationModel,
): Promise<INoiseCancellation> => {
  const { NoiseCancellation, FastEnhancerNoiseCancellation } =
    await import('@stream-io/audio-filters-web');
  console.info('[dogfood] noise cancellation model:', model);
  switch (model) {
    case 'fastenhancer-tiny':
      return new FastEnhancerNoiseCancellation({ model: 'tiny' });
    case 'fastenhancer-base':
      return new FastEnhancerNoiseCancellation({ model: 'base' });
    case 'fastenhancer-small':
      return new FastEnhancerNoiseCancellation({ model: 'small' });
    case 'krisp':
    default:
      return new NoiseCancellation();
  }
};
