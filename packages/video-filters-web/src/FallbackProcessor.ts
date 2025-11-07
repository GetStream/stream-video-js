import { WorkerTimer } from '@stream-io/worker-timer';

/**
 * Type representing a video track processor that can be either the native
 * MediaStreamTrackProcessor or the fallback implementation.
 */
export interface MediaStreamTrackProcessor {
  readable: ReadableStream;
}

/**
 * Fallback video processor for browsers that do not support
 * MediaStreamTrackProcessor.
 *
 * Takes a video track and produces a `ReadableStream<VideoFrame>` by drawing
 * frames to an `OffscreenCanvas`.
 */
class FallbackProcessor implements MediaStreamTrackProcessor {
  readonly readable: ReadableStream<VideoFrame>;
  readonly timers: WorkerTimer;

  constructor({ track }: { track: MediaStreamTrack }) {
    if (!track) throw new Error('MediaStreamTrack is required');
    if (track.kind !== 'video') {
      throw new Error('MediaStreamTrack must be video');
    }
    let running = true;

    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = 'anonymous';
    video.srcObject = new MediaStream([track]);

    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Failed to get 2D context from OffscreenCanvas');

    let timestamp = 0;
    const frameRate = track.getSettings().frameRate || 30;
    let frameDuration = 1000 / frameRate;

    const close = () => {
      video.pause();
      video.srcObject = null;
      video.src = '';

      this.timers.destroy();
    };

    this.timers = new WorkerTimer({ useWorker: true });
    this.readable = new ReadableStream({
      start: async () => {
        await Promise.all([
          video.play(),
          new Promise((r) =>
            video.addEventListener('loadeddata', r, { once: true }),
          ),
        ]);
        frameDuration = 1000 / (track.getSettings().frameRate || 30);
        timestamp = performance.now();
      },
      pull: async (controller) => {
        if (!running) {
          controller.close();
          close();
          return;
        }
        const delta = performance.now() - timestamp;
        if (delta < frameDuration) {
          await new Promise((r: (value?: unknown) => void) =>
            this.timers.setTimeout(r, frameDuration - delta),
          );
        }
        timestamp = performance.now();
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        controller.enqueue(new VideoFrame(canvas, { timestamp }));
      },
      cancel: () => {
        running = false;
        close();
      },
    });
  }
}

const TrackProcessor =
  typeof MediaStreamTrackProcessor !== 'undefined'
    ? MediaStreamTrackProcessor
    : FallbackProcessor;

export { TrackProcessor };
