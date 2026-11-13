import type { NoiseCancellationOptions } from '@stream-io/audio-filters-web';
import { MODEL } from '../noise-cancellation/model';

export type NoiseCancellationModel = 'auto' | 'krisp' | 'stream';

export const NOISE_CANCELLATION_MODELS: NoiseCancellationModel[] = [
  'auto',
  'krisp',
  'stream',
];

/**
 * The `stream` engine runs the app's own model build, served by the app
 * (see noise-cancellation/README.md), so a new build ships with Pronto
 * without an SDK release.
 */
const streamOptions = {
  basePath: `${process.env.NEXT_PUBLIC_BASE_PATH || ''}/noise-cancellation/models`,
  model: MODEL,
};

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
        stream: streamOptions,
      };
    case 'stream':
      return {
        defaultEngine: 'stream',
        stream: streamOptions,
      };
    case 'auto':
    default:
      return {
        stream: streamOptions,
      };
  }
};
