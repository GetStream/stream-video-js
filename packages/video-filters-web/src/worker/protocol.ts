import type {
  BackgroundEffectOptions,
  BackgroundOptions,
  PerformanceStats,
} from '../types';

/**
 * Messages from the main thread to the worker.
 * The input track is transferred with `start`.
 */
export type ToWorkerMessage =
  | { type: 'start'; track: MediaStreamTrack; options: BackgroundOptions }
  | { type: 'update'; id: number; options: BackgroundEffectOptions }
  | { type: 'stop' };

/**
 * Messages from the worker to the main thread.
 * The processed track is transferred with `started`.
 */
export type FromWorkerMessage =
  | { type: 'started'; track: MediaStreamTrack }
  | { type: 'stats'; stats: PerformanceStats }
  | { type: 'error'; message: string }
  | { type: 'updated'; id: number }
  | { type: 'updateError'; id: number; message: string }
  | { type: 'stopped' };
