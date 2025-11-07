/**
 * Type representing a video track generator that can be either the native
 * MediaStreamTrackGenerator or the fallback implementation.
 */
export interface MediaStreamTrackGenerator extends MediaStreamTrack {
  readonly writable: WritableStream;
}

/**
 * Fallback video processor for browsers that do not support
 * MediaStreamTrackGenerator.
 *
 * Produces a video MediaStreamTrack sourced from a canvas and exposes
 * a WritableStream<VideoFrame> on track.writable for writing frames.
 */
class FallbackGenerator {
  constructor({
    kind,
    signalTarget,
  }: {
    kind: 'video';
    signalTarget?: MediaStreamTrack;
  }) {
    if (kind !== 'video') {
      throw new Error('Only video tracks are supported');
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { desynchronized: true });
    if (!ctx) {
      throw new Error('Failed to get 2D context from canvas');
    }

    const mediaStream = canvas.captureStream();
    const track = mediaStream.getVideoTracks()[0] as MediaStreamVideoTrack & {
      writable: WritableStream<VideoFrame>;
    };

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
        canvas.width = frame.displayWidth;
        canvas.height = frame.displayHeight;

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

    return track as MediaStreamTrackGenerator;
  }
}

const TrackGenerator =
  typeof MediaStreamTrackGenerator !== 'undefined'
    ? MediaStreamTrackGenerator
    : FallbackGenerator;

export { TrackGenerator };
