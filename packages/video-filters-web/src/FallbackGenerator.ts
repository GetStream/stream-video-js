/**
 * Type representing a video track generator that can be either the native
 * MediaStreamTrackGenerator or the fallback implementation.
 */
export interface MediaStreamTrackGenerator<T> extends MediaStreamTrack {
  writable: WritableStream<T>;
}

/**
 * Configuration options for creating a track generator.
 */
export interface TrackGeneratorOptions {
  readonly kind: 'video';
  readonly signalTarget?: MediaStreamTrack;
}

/**
 * Fallback video processor for browsers that do not support MediaStreamTrackGenerator.
 *
 * Produces a video MediaStreamTrack sourced from a canvas and exposes
 * a WritableStream<VideoFrame> on track.writable for writing frames.
 */
class FallbackGenerator {
  constructor({ kind, signalTarget }: TrackGeneratorOptions) {
    if (kind !== 'video') {
      throw new Error('Only video tracks are supported');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { desynchronized: true });
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    const mediaStream = canvas.captureStream();
    const track =
      mediaStream.getVideoTracks()[0] as MediaStreamTrackGenerator<VideoFrame>;

    const height = signalTarget?.getSettings().height;
    const width = signalTarget?.getSettings().width;
    if (height && width) {
      canvas.height = height;
      canvas.width = width;
    }

    if (!track) {
      throw new Error('Failed to create canvas track');
    }

    if (signalTarget) {
      signalTarget.addEventListener('ended', () => {
        track.stop();
      });
    }

    track.writable = new WritableStream({
      write: (frame: VideoFrame) => {
        if (
          canvas.width !== frame.displayWidth ||
          canvas.height !== frame.displayHeight
        ) {
          canvas.width = frame.displayWidth;
          canvas.height = frame.displayHeight;
        }

        ctx.drawImage(frame, 0, 0, canvas.width, canvas.height);
        frame.close();
      },
      abort: () => {
        track.stop();
      },
      close: () => {
        track.stop();
      },
    });

    return track as MediaStreamTrackGenerator<VideoFrame>;
  }
}

type VideoTrackGeneratorConstructor = new (
  options: TrackGeneratorOptions,
) => MediaStreamTrackGenerator<VideoFrame>;

const TrackGenerator: VideoTrackGeneratorConstructor =
  typeof MediaStreamTrackGenerator !== 'undefined'
    ? (MediaStreamTrackGenerator as unknown as VideoTrackGeneratorConstructor)
    : (FallbackGenerator as unknown as VideoTrackGeneratorConstructor);

export { TrackGenerator };
