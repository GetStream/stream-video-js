import { videoLoggerSystem } from '../logger';
import { promiseWithResolvers } from './promise';

export type MediaStreamRecorderOptions = {
  /** Auto-stop after this many milliseconds. */
  maxDurationMs?: number;
};

export type MediaRecordingResult = {
  blob: Blob;
};

/** Single-use `MediaRecorder` wrapper that returns an in-memory blob. */
export class MediaStreamRecorder {
  private recording = promiseWithResolvers<MediaRecordingResult | null>();
  private logger = videoLoggerSystem.getLogger('MediaStreamRecorder');
  private chunks: Blob[] = [];
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  private recorder: MediaRecorder;
  private readonly tracks: MediaStreamTrack[];
  private readonly maxDurationMs: number | undefined;

  constructor(stream: MediaStream, options: MediaStreamRecorderOptions = {}) {
    if (typeof MediaRecorder === 'undefined') {
      throw new Error('MediaRecorder is not available in this environment');
    }

    this.tracks = stream.getTracks();
    if (this.tracks.length === 0) {
      throw new Error('cannot record a MediaStream that has no tracks');
    }

    this.maxDurationMs = options.maxDurationMs;
    this.recorder = new MediaRecorder(new MediaStream(this.tracks));

    this.recorder.ondataavailable = (event: BlobEvent) => {
      if (event.data?.size) this.chunks.push(event.data);
    };

    this.recorder.onstop = this.handleStop;
    this.recorder.onerror = this.handleError;
  }

  /** Starts recording and resolves when recording stops. */
  start = (): Promise<MediaRecordingResult | null> => {
    if (this.isSettled()) {
      throw new Error(
        'MediaStreamRecorder is single-use: this instance has already ' +
          'recorded. Construct a new one.',
      );
    }

    if (this.recorder.state === 'inactive') {
      this.tracks.forEach((track) =>
        track.addEventListener('ended', this.stop),
      );
      if (this.maxDurationMs !== undefined) {
        this.timeoutId = setTimeout(this.stop, this.maxDurationMs);
      }
      this.recorder.start();
    }

    return this.recording.promise;
  };

  /** Stops recording early. */
  stop = (): void => {
    if (this.recorder.state !== 'inactive') this.recorder.stop();
  };

  private isSettled = () =>
    this.recording.isResolved() || this.recording.isRejected();

  private detach = () => {
    clearTimeout(this.timeoutId);
    this.tracks.forEach((track) =>
      track.removeEventListener('ended', this.stop),
    );
  };

  private handleStop = () => {
    this.detach();

    if (this.chunks.length === 0) {
      this.logger.warn('MediaRecorder recording produced no data');
      this.recording.resolve(null);
      return;
    }

    const mimeType = this.chunks[0].type || this.recorder.mimeType;
    this.recording.resolve({
      blob: new Blob(this.chunks, { type: mimeType }),
    });
  };

  private handleError = (event: Event) => {
    if (this.isSettled()) return;
    this.detach();
    const error = (event as unknown as { error?: DOMException }).error;
    this.logger.error('MediaRecorder error', error);
    this.recording.reject(error ?? new Error('MediaRecorder failed'));
  };
}
