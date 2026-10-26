import type {
  BackgroundEffectOptions,
  BackgroundOptions,
  BackgroundProcessor,
  VideoTrackProcessorHooks,
} from '../types';
import type { FromWorkerMessage, ToWorkerMessage } from './protocol';
import { canTransferTracks } from './support';

type Deferred<T> = {
  resolve: (value: T) => void;
  reject: (error: Error) => void;
};

/**
 * Relative URLs don't resolve inside a `blob:` worker,
 * so they are resolved against the page first.
 */
const withAbsoluteUrls = <T extends BackgroundOptions>(options: T): T => {
  const resolved = { ...options };
  for (const key of ['basePath', 'modelPath', 'backgroundImage'] as const) {
    const url = resolved[key];
    if (url) resolved[key] = new URL(url, location.href).href;
  }
  return resolved;
};

/**
 * Runs {@link VirtualBackground} in a dedicated worker, for browsers that
 * expose MediaStreamTrackProcessor and VideoTrackGenerator only in workers
 * (Safari 18+). A clone of the input track is transferred in and the
 * processed track is transferred back.
 *
 * The worker is inlined into the bundle and started from a `blob:` URL,
 * so the Content-Security-Policy has to allow `worker-src blob:`.
 *
 * @experimental
 */
export class WorkerVirtualBackground implements BackgroundProcessor {
  private readonly track: MediaStreamVideoTrack;
  private readonly hooks: VideoTrackProcessorHooks;
  private options: BackgroundOptions;

  private worker?: Worker;
  private output?: MediaStreamTrack;
  private starting?: Promise<MediaStreamTrack>;
  private stopped = false;

  private pendingStart?: Deferred<MediaStreamTrack>;
  private readonly pendingUpdates = new Map<number, Deferred<void>>();
  private nextUpdateId = 1;

  constructor(
    track: MediaStreamVideoTrack,
    options: BackgroundOptions = {},
    hooks: VideoTrackProcessorHooks = {},
  ) {
    this.track = track;
    this.options = options;
    this.hooks = hooks;
  }

  /**
   * Whether the track APIs are missing on the main thread
   * but tracks can be transferred to a worker (Safari 18+).
   */
  static isSupported = (): boolean =>
    typeof Worker !== 'undefined' &&
    typeof VideoFrame !== 'undefined' &&
    typeof MediaStreamTrackProcessor === 'undefined' &&
    canTransferTracks();

  start = async (): Promise<MediaStreamTrack> => {
    this.starting = this.startWorker();
    try {
      this.output = await this.starting;
    } catch (error) {
      this.disposeWorker();
      throw error;
    }
    this.track.addEventListener('ended', this.stop, { once: true });
    return this.output;
  };

  updateOptions = async (options: BackgroundEffectOptions): Promise<void> => {
    const { basePath, modelPath } = this.options;
    const previous = this.options;
    this.options = { basePath, modelPath, ...options };
    if (!this.worker) {
      if (this.starting && !this.output) await this.starting;
      return;
    }
    const id = this.nextUpdateId++;
    return new Promise<void>((resolve, reject) => {
      this.pendingUpdates.set(id, {
        resolve,
        reject: (error) => {
          if (this.options !== previous) this.options = previous;
          reject(error);
        },
      });
      this.post({ type: 'update', id, options: withAbsoluteUrls(options) });
    });
  };

  stop = (): void => {
    if (this.stopped) return;
    this.stopped = true;
    this.track.removeEventListener('ended', this.stop);
    this.output?.stop();
    this.settleStart(new Error('Stopped'));
    if (!this.worker) return;
    setTimeout(this.disposeWorker, 1000);
    this.post({ type: 'stop' });
  };

  private startWorker = async (): Promise<MediaStreamTrack> => {
    const { default: VideoFiltersWorker } =
      await import('./worker?worker&inline');

    if (this.stopped) throw new Error('Stopped');
    const worker = new VideoFiltersWorker({ name: 'stream-video-filters' });
    this.worker = worker;

    worker.onmessage = (e: MessageEvent<FromWorkerMessage>) =>
      this.dispatch(e.data);
    worker.onerror = (e) =>
      this.fail(
        new Error(
          e.message ||
            "Can't load the worker. Allow `worker-src blob:` in the Content-Security-Policy.",
        ),
      );

    const started = new Promise<MediaStreamTrack>((resolve, reject) => {
      this.pendingStart = { resolve, reject };
    });

    const clone = this.track.clone();
    this.post(
      { type: 'start', track: clone, options: withAbsoluteUrls(this.options) },
      [clone as unknown as Transferable],
    );
    return started;
  };

  private dispatch = (message: FromWorkerMessage) => {
    switch (message.type) {
      case 'started':
        this.pendingStart?.resolve(message.track);
        this.pendingStart = undefined;
        break;
      case 'stats':
        this.hooks.onStats?.(message.stats);
        break;
      case 'updated':
      case 'updateError': {
        const pending = this.pendingUpdates.get(message.id);
        this.pendingUpdates.delete(message.id);
        if (message.type === 'updated') pending?.resolve();
        else pending?.reject(new Error(message.message));
        break;
      }
      case 'error':
        this.fail(new Error(message.message));
        break;
      case 'stopped':
        this.disposeWorker();
        break;
    }
  };

  private fail = (error: Error) => {
    if (this.pendingStart) this.settleStart(error);
    else this.hooks.onError?.(error);
  };

  private settleStart = (error: Error) => {
    this.pendingStart?.reject(error);
    this.pendingStart = undefined;
  };

  private disposeWorker = () => {
    this.settleStart(new Error('Worker terminated'));
    for (const pending of this.pendingUpdates.values()) {
      pending.reject(new Error('Stopped'));
    }
    this.pendingUpdates.clear();
    this.worker?.terminate();
    this.worker = undefined;
  };

  private post = (message: ToWorkerMessage, transfer: Transferable[] = []) =>
    this.worker?.postMessage(message, transfer);
}
