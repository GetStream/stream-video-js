import type {
  BackgroundOptions,
  BackgroundProcessor,
  VideoTrackProcessorHooks,
} from './types';
import { VirtualBackground } from './VirtualBackground';
import { WorkerVirtualBackground } from './worker/WorkerVirtualBackground';

/**
 * Creates the background processor for the current browser:
 * {@link WorkerVirtualBackground} where the track APIs exist only in workers
 * (Safari 18+), {@link VirtualBackground} everywhere else.
 */
export const createVirtualBackground = (
  track: MediaStreamVideoTrack,
  options: BackgroundOptions = {},
  hooks: VideoTrackProcessorHooks = {},
): BackgroundProcessor =>
  WorkerVirtualBackground.isSupported()
    ? new WorkerVirtualBackground(track, options, hooks)
    : new VirtualBackground(track, options, hooks);
