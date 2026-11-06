import type {
  IAudioFilterNode,
  IKrispSDK,
  ISDKPartialOptions,
} from './krispai';
import { packageName, packageVersion } from './version';
import { simd } from 'wasm-feature-detect';
import type { Tracer } from './tracer';
import {
  BaseNoiseCancellation,
  WARM_UP_GRACE_MS,
} from './BaseNoiseCancellation';
import { isWebKit } from './isWebKit';
import type { NoiseCancellationConfiguration } from './INoiseCancellation';

type KrispSDKClass = typeof import('./krispai').default;

let krispPromise: Promise<KrispSDKClass> | undefined;

/**
 * Loads the Krisp SDK on first use, so that its ~5 MB chunk isn't fetched
 * until noise cancellation is actually needed.
 * A failed load isn't cached, so a later call can retry.
 */
const loadKrispSDK = () =>
  (krispPromise ??= import('./krispai')
    .then((m) => {
      // Depending on the loader (bundler vs. native Node `import()` of CJS),
      // the class is `m.default`, or nested one level deeper.
      const d = (m.default ?? m) as unknown as { default?: KrispSDKClass };
      return (d.default ?? d) as KrispSDKClass;
    })
    .catch((err) => {
      krispPromise = undefined;
      throw err;
    }));

/**
 * Krisp reports a single stall as a burst of overflow events.
 * Overflows within this window after a handled one count as the same overload.
 */
const OVERLOAD_DEBOUNCE_MS = 1000;

/**
 * Options to pass to the KrispNoiseCancellation instance.
 */
export type KrispNoiseCancellationOptions = {
  /**
   * The base path to load the models from.
   * You can override this if you want to host the models yourself.
   * @default `https://unpkg.com/@stream-io/audio-filters-web@${packageVersion}/src/krispai/models`.
   */
  basePath?: string;

  /**
   * When Krisp SDK detects buffer overflow, it will disable the filter and
   * wait for this timeout before enabling it again.
   * Defaults to 15000 ms.
   */
  restoreTimeoutMs?: number;

  /**
   * The number of attempts to restore the filter after a buffer overflow.
   * Defaults to 3.
   */
  restoreAttempts?: number;

  /**
   * Whether Noise Cancellation is supported in Safari and other WebKit-based
   * browsers, such as every iOS browser and WebView.
   * Krisp isn't fully reliable there yet, so by default `isSupported()`
   * reports these browsers as unsupported.
   * Defaults to false.
   */
  withSafariSupport?: boolean;

  /**
   * Optional Krisp SDK parameters.
   */
  krispSDKParams?: ISDKPartialOptions['params'];
};

// https://sdk-docs.krisp.ai/docs/krisp-audio-sdk-model-selection-guide
const DEFAULT_MODEL_FILE = 'krisp-nc-o-med-v7.kef';

const toModelName = (url: string | undefined) => {
  const file = url?.split(/[?#]/)[0].split('/').pop();
  return file?.replace(/\.[^.]*$/, '') || undefined;
};

/**
 * A wrapper around the Krisp.AI SDK.
 */
export class KrispNoiseCancellation extends BaseNoiseCancellation {
  readonly engine = 'krisp';
  private sdk?: IKrispSDK;
  private filterNode?: IAudioFilterNode;
  private restoreTimeoutId?: number;
  private overloadCount = 0;
  private lastOverloadAt = -Infinity;
  private warmUpEndsAt?: number;

  private readonly basePath: string;
  private readonly hasCustomBasePath: boolean;
  private modelPath: string | undefined;
  private readonly restoreTimeoutMs: number;
  private readonly restoreAttempts: number;
  private withSafariSupport: boolean;
  private readonly hasExplicitSafariSupport: boolean;
  private readonly krispSDKParams?: ISDKPartialOptions['params'];

  /**
   * Constructs a new instance.
   */
  constructor({
    basePath,
    restoreTimeoutMs = 15000,
    restoreAttempts = 3,
    withSafariSupport,
    krispSDKParams,
  }: KrispNoiseCancellationOptions = {}) {
    super();
    this.basePath =
      basePath ??
      `https://unpkg.com/${packageName}@${packageVersion}/src/krispai/models`;
    this.hasCustomBasePath = typeof basePath !== 'undefined';
    this.restoreTimeoutMs = restoreTimeoutMs;
    this.restoreAttempts = restoreAttempts;
    this.withSafariSupport = withSafariSupport ?? false;
    this.hasExplicitSafariSupport = typeof withSafariSupport !== 'undefined';
    this.krispSDKParams = krispSDKParams;
  }

  /**
   * The model the engine runs: its file name without the extension,
   * e.g. `krisp-nc-o-med-v7`.
   */
  get model(): string | undefined {
    const models = this.krispSDKParams?.models;
    if (models) {
      const modelNC = models.modelNC;
      return toModelName(typeof modelNC === 'string' ? modelNC : modelNC?.url);
    }
    return toModelName(
      this.modelPath ?? `${this.basePath}/${DEFAULT_MODEL_FILE}`,
    );
  }

  /**
   * Applies options from the call settings. Options passed to the
   * constructor take precedence. Call it before {@link isSupported} and
   * {@link init}: a model path applied after `init` takes effect on the
   * next `init`.
   */
  configure = (configuration: NoiseCancellationConfiguration) => {
    const { withSafariSupport, modelPath } = configuration;
    if (!this.hasExplicitSafariSupport) {
      this.withSafariSupport = withSafariSupport ?? false;
    }
    if (!this.hasCustomBasePath) {
      this.modelPath = modelPath;
    }
  };

  /**
   * Checks if the noise cancellation is supported on this platform.
   * Make sure you call this method before trying to enable the noise cancellation.
   *
   * Safari and other WebKit-based browsers are reported as unsupported
   * unless `withSafariSupport` is set.
   */
  isSupported = async () => {
    if (isWebKit()) {
      if (!this.withSafariSupport) return false;
      // The SDK's own check only gates Safari by version (17.4+), so the
      // ~5 MB chunk is loaded here for WebKit only, not on every page.
      let sdk: KrispSDKClass;
      try {
        sdk = await loadKrispSDK();
      } catch (err) {
        console.warn(
          'Failed to load the Krisp SDK, reporting it as unsupported',
          err,
        );
        return false;
      }
      if (!sdk.isSupported()) return false;
    }
    return simd();
  };

  /**
   * Initializes the KrispAI SDK.
   *
   * Will throw in case the noise cancellation is not supported on this platform
   * or if the SDK is already initialized.
   */
  init = async (options: { tracer?: Tracer } = {}) => {
    if (!(await this.isSupported())) {
      throw new Error('NoiseCancellation is not supported on this platform');
    }
    if (this.sdk) {
      throw new Error('NoiseCancellation is already initialized');
    }
    const KrispSDK = await loadKrispSDK();
    const sdk = new KrispSDK({
      params: {
        debugLogs: false,
        logProcessStats: false,
        useSharedArrayBuffer: false,
        models: {
          modelNC: this.modelPath ?? `${this.basePath}/${DEFAULT_MODEL_FILE}`,
        },
        ...this.krispSDKParams,
      },
    });
    await sdk.init();
    this.sdk = sdk;
    this.tracer = options.tracer;

    const audioContext = new AudioContext();
    this.audioContext = audioContext;

    this.startRecovery(audioContext);

    const filterNode = await sdk.createNoiseFilter(
      this.audioContext,
      () => {
        this.tracer?.trace('noiseCancellation.started', 'true');
        this.resolveInitialized();
      },
      this.handleUnexpectedDispose,
    );
    filterNode.addEventListener('buffer_overflow', this.handleBufferOverflow);
    filterNode.addEventListener('error', this.handleError);
    this.filterNode = filterNode;

    return this.initializing;
  };

  /**
   * Checks if the noise cancellation is enabled.
   */
  isEnabled = async () => {
    if (!this.filterNode) return false;
    return this.filterNode.isEnabled();
  };

  /**
   * Enables the noise cancellation.
   */
  enable = async () => {
    window.clearTimeout(this.restoreTimeoutId);
    await this.setFilterEnabled(true);
  };

  /**
   * Disables the noise cancellation.
   */
  disable = async () => {
    window.clearTimeout(this.restoreTimeoutId);
    await this.setFilterEnabled(false);
  };

  /**
   * Disposes the instance and releases all resources.
   */
  dispose = async () => {
    window.clearTimeout(this.restoreTimeoutId);
    this.stopRecovery();
    if (this.filterNode) {
      await this.disable().catch((err) =>
        console.warn('Failed to disable noise cancellation on dispose', err),
      );
      this.filterNode.removeEventListener('error', this.handleError);
      this.filterNode.removeEventListener(
        'dispose',
        this.handleUnexpectedDispose,
      );
      this.filterNode.removeEventListener(
        'buffer_overflow',
        this.handleBufferOverflow,
      );
      this.filterNode.dispose();
      this.filterNode = undefined;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      await this.audioContext.close().catch((err) => {
        console.warn('Failed to close the audio context', err);
      });
      this.audioContext = undefined;
    }
    if (this.sdk) {
      this.sdk.dispose();
      this.sdk = undefined;
    }
    this.overloadCount = 0;
    this.lastOverloadAt = -Infinity;
    this.warmUpEndsAt = undefined;
  };

  /**
   * Sets the noise suppression level (0-100).
   *
   * @param level 0 for no suppression, 100 for maximum suppression.
   */
  setSuppressionLevel = (level: number) => {
    // @ts-expect-error not yet in the types, but exists in the implementation
    if (!this.filterNode || !this.filterNode.setNoiseSuppressionLevel) {
      throw new Error(
        'NoiseCancellation is not initialized with a filter node that supports noise suppression level',
      );
    }
    if (level < 0 || level > 100) {
      throw new Error('NoiseCancellation level must be between 0 and 100');
    }
    // @ts-expect-error not yet in the types, but exists in the implementation
    this.filterNode.setNoiseSuppressionLevel(level);
  };

  /**
   * Connects the Krisp filter node between the given nodes.
   */
  protected connectFilter = (
    source: MediaStreamAudioSourceNode,
    destination: MediaStreamAudioDestinationNode,
  ) => {
    const { filterNode } = this;
    if (!filterNode) {
      throw new Error('NoiseCancellation is not initialized');
    }
    source.connect(filterNode).connect(destination);
    return () => {
      // the filter node may already be disposed
      try {
        source.disconnect();
        filterNode.disconnect(destination);
      } catch {
        // not connected
      }
    };
  };

  /**
   * Toggles the filter and notifies the `change` listeners.
   * Unlike `enable()` and `disable()`, it keeps a pending restore scheduled.
   */
  private setFilterEnabled = async (enabled: boolean) => {
    if (!this.filterNode) return;
    await this.initializing;

    if (enabled) {
      this.warmUpEndsAt ??= performance.now() + WARM_UP_GRACE_MS;
      this.filterNode.enable();
    } else {
      this.filterNode.disable();
    }
    this.dispatch('change', enabled);
  };

  /**
   * Traces errors reported by the Krisp SDK.
   *
   * The SDK surfaces model fetch/load, unsupported sample-rate and WASM/session
   * init failures (`MODEL_URL_FETCH_ERROR`, `MODEL_LOAD_ERROR`,
   * `SAMPLING_RATE_NOT_SUPPORTED`, `NC_SESSION_INIT_ERROR`,
   * `AR_SESSION_INIT_ERROR`, `WASM_INIT_ERROR`) via an `error` event on the
   * filter node, separately from the `ready` callback.
   * We record them for diagnostics.
   */
  private handleError = (
    e: Event & { data?: { errorCode?: string; errorMessage?: string } },
  ) => {
    const code = (e && e.data && e.data.errorCode) || 'UNKNOWN';
    const message = (e && e.data && e.data.errorMessage) || '';
    this.tracer?.trace('noiseCancellation.error', `${code} ${message}`.trim());
    this.rejectInitialized(
      new Error(
        `NoiseCancellation failed to initialize: ${code} ${message}`.trim(),
      ),
    );
  };

  /**
   * Handles a `dispose` of the filter node that we didn't initiate.
   *
   * Since 2.3.10, the Krisp SDK disposes the filter node on its own when its
   * web worker fails to start (e.g., a CSP that blocks `blob:` workers). This
   * happens after `createNoiseFilter` has resolved, and `dispose` is the only
   * signal we get, so without this `init()` would never settle.
   * Our own `dispose()` unregisters this handler before disposing the node.
   */
  private handleUnexpectedDispose = () => {
    this.tracer?.trace('noiseCancellation.error', 'FILTER_NODE_DISPOSED');
    this.rejectInitialized(
      new Error(
        'NoiseCancellation failed to initialize: FILTER_NODE_DISPOSED the filter was disposed before it became ready',
      ),
    );
  };

  /**
   * Handles the buffer overflow event.
   * Disables the filter and waits for the restore timeout before enabling it again.
   * Notifies the `overload` listeners once the filter is disabled.
   * Overflows during the warm-up window, or within the same burst, are ignored.
   *
   * Based on: https://sdk-docs.krisp.ai/docs/getting-started-js#system-overload-handling
   */
  private handleBufferOverflow = (
    // extending the Event type to include the data property as it is not yet
    // in the types but exists in the implementation
    e: Event & {
      data?: {
        overflowCount?: number;
        isBufferDropped?: boolean;
      };
    },
  ) => {
    const count = (e && e.data && e.data.overflowCount) ?? 0;
    const isBufferDropped = (e && e.data && e.data.isBufferDropped) ?? false;

    this.tracer?.trace('noiseCancellation.bufferOverflowCount', String(count));
    if (isBufferDropped) {
      this.tracer?.trace('noiseCancellation.bufferDropped', 'true');
    }

    const now = performance.now();
    if (this.warmUpEndsAt !== undefined && now < this.warmUpEndsAt) {
      this.tracer?.trace('noiseCancellation.bufferOverflowIgnored', 'warm-up');
      return;
    }
    if (now - this.lastOverloadAt < OVERLOAD_DEBOUNCE_MS) {
      this.tracer?.trace('noiseCancellation.bufferOverflowIgnored', 'burst');
      return;
    }
    this.lastOverloadAt = now;
    this.overloadCount++;

    const willRestore = this.overloadCount < this.restoreAttempts;
    window.clearTimeout(this.restoreTimeoutId);
    if (willRestore) {
      this.restoreTimeoutId = window.setTimeout(() => {
        this.setFilterEnabled(true).catch((err) =>
          console.error('Failed to enable noise cancellation ', err),
        );
      }, this.restoreTimeoutMs);
    }

    this.setFilterEnabled(false)
      .then(() => {
        this.dispatch('overload', {
          willRestore,
          overflowCount: this.overloadCount,
          restoreInMs: willRestore ? this.restoreTimeoutMs : undefined,
        });
      })
      .catch((err) =>
        console.error('Failed to disable noise cancellation ', err),
      );
  };
}
