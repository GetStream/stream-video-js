import { WorkerTimer } from '@stream-io/worker-timer';

/**
 * Representing a video track processor that can be either the native
 * MediaStreamTrackProcessor or the fallback implementation.
 */
export interface MediaStreamTrackProcessor<T> {
  readonly readable: ReadableStream<T>;
}

/**
 * Configuration options for creating a track processor.
 */
export interface TrackProcessorOptions {
  readonly track: MediaStreamTrack;
}

/**
 * Fallback implementation for browsers without MediaStreamTrackGenerator.
 *
 * Produces a video MediaStreamTrack sourced from a canvas and exposes a
 * WritableStream<VideoFrame> on track.writable. Written frames are drawn
 * into the canvas and update the underlying track automatically.
 */
class FallbackProcessor implements MediaStreamTrackProcessor<VideoFrame> {
  readonly readable: ReadableStream<VideoFrame>;

  readonly workerTimer: WorkerTimer;
  readonly video: HTMLVideoElement;

  constructor({ track }: TrackProcessorOptions) {
    if (!track) throw new Error('MediaStreamTrack is required');
    if (track.kind !== 'video') {
      throw new Error('MediaStreamTrack must be video');
    }
    let running = true;

    this.video = document.createElement('video');

    this.video.muted = true;
    this.video.playsInline = true;
    this.video.srcObject = new MediaStream([track]);

    const canvas = new OffscreenCanvas(1, 1);
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('Failed to get 2D context from OffscreenCanvas');

    let timestamp = 0;
    const frameRate = track.getSettings().frameRate || 30;
    let frameDuration = 1000 / frameRate;
    let lastVideoTime = -1;

    this.workerTimer = new WorkerTimer({ useWorker: true });
    this.readable = new ReadableStream({
      start: async () => {
        await Promise.all([
          this.video.play(),
          new Promise((r) =>
            this.video.addEventListener('loadeddata', r, { once: true }),
          ),
        ]);
        frameDuration = 1000 / (track.getSettings().frameRate || 30);
        timestamp = performance.now();
      },
      pull: async (controller) => {
        if (!running) {
          controller.close();
          this.close();
          return;
        }
        const delta = performance.now() - timestamp;
        if (delta <= frameDuration) {
          await new Promise((r: (value?: unknown) => void) =>
            this.workerTimer.setTimeout(r, frameDuration - delta),
          );
        }
        timestamp = performance.now();

        const currentTime = this.video.currentTime;
        const hasNewFrame = currentTime !== lastVideoTime;

        if (!hasNewFrame) {
          await new Promise((r: (value?: unknown) => void) =>
            this.workerTimer.setTimeout(r, frameDuration),
          );
          return;
        }

        lastVideoTime = currentTime;

        if (
          canvas.width !== this.video.videoWidth ||
          canvas.height !== this.video.videoHeight
        ) {
          canvas.width = this.video.videoWidth;
          canvas.height = this.video.videoHeight;
        }

        ctx.drawImage(this.video, 0, 0);

        try {
          const frame = new VideoFrame(canvas, { timestamp });
          controller.enqueue(frame);
        } catch (err) {
          running = false;
          controller.error(err);
          this.close();
        }
      },
      cancel: () => {
        running = false;
        this.close();
      },
    });
  }

  public close = () => {
    this.video.pause();
    this.video.srcObject = null;
    this.video.src = '';

    this.workerTimer.destroy();
  };
}

const TrackProcessor =
  typeof MediaStreamTrackProcessor !== 'undefined'
    ? MediaStreamTrackProcessor
    : FallbackProcessor;

export { TrackProcessor };
