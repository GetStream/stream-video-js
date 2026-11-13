import type { NoiseCancellationOptions } from '@stream-io/audio-filters-web';

export type NoiseCancellationModel = 'auto' | 'krisp' | 'stream';

export const NOISE_CANCELLATION_MODELS: NoiseCancellationModel[] = [
  'auto',
  'krisp',
  'stream',
];

/**
 * The `stream` engine's model is served by this app, see
 * scripts/copy-noise-cancellation-models.mjs.
 */
const streamBasePath = `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/noise-cancellation/models`;

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
        stream: { basePath: streamBasePath },
      };
    case 'stream':
      return {
        defaultEngine: 'stream',
        stream: { basePath: streamBasePath },
      };
    case 'auto':
    default:
      return {
        stream: { basePath: streamBasePath },
      };
  }
};
