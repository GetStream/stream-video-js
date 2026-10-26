import type {
  BackgroundOptions,
  BackgroundProcessor,
  VideoTrackProcessorHooks,
} from './types';
import { VirtualBackground } from './VirtualBackground';
import { WorkerVirtualBackground } from './worker/WorkerVirtualBackground';

/**
 * Creates the background-effect processor for the current browser: the
 * {@link WorkerVirtualBackground} where the track APIs exist only in workers
 * (Safari 18+), the main-thread {@link VirtualBackground} everywhere else.
 */
export const createVirtualBackground = (
  track: MediaStreamVideoTrack,
  options: BackgroundOptions = {},
  hooks: VideoTrackProcessorHooks = {},
): BackgroundProcessor =>
  WorkerVirtualBackground.isSupported()
    ? new WorkerVirtualBackground(track, options, hooks)
    : new VirtualBackground(track, options, hooks);
