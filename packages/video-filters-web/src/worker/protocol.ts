import type {
  BackgroundEffectOptions,
  BackgroundOptions,
  PerformanceStats,
} from '../types';

/**
 * Messages from the main thread to the background-effect worker.
 *
 * The input track is transferred in, the worker builds
 * MediaStreamTrackProcessor + VideoTrackGenerator (Safari exposes them only
 * in workers), and the generated track is transferred back.
 */
export type ToWorkerMessage =
  | { type: 'start'; track: MediaStreamTrack; options: BackgroundOptions }
  | { type: 'update'; id: number; options: BackgroundEffectOptions }
  | { type: 'stop' };

/**
 * Messages from the background-effect worker to the main thread.
 */
export type FromWorkerMessage =
  | { type: 'started'; track: MediaStreamTrack }
  | { type: 'stats'; stats: PerformanceStats }
  | { type: 'error'; message: string }
  | { type: 'updated'; id: number }
  | { type: 'updateError'; id: number; message: string }
  | { type: 'stopped' };
