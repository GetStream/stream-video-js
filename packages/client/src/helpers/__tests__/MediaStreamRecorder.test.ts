/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { MediaStreamRecorder } from '../MediaStreamRecorder';
import { videoLoggerSystem } from '../../logger';

const createTrack = (kind: 'audio' | 'video' = 'video') => {
  const events = new EventTarget();
  return fromPartial<MediaStreamTrack>({
    kind,
    id: `${kind}-track`,
    readyState: 'live',
    stop: vi.fn(),
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
  });
};

class FakeMediaStream {
  private tracks: MediaStreamTrack[];

  constructor(tracks: MediaStreamTrack[] = []) {
    this.tracks = [...tracks];
  }

  getTracks = () => [...this.tracks];
  addTrack = (track: MediaStreamTrack) => this.tracks.push(track);
}

const createStream = (...tracks: MediaStreamTrack[]) =>
  new FakeMediaStream(tracks) as unknown as MediaStream;

class FakeMediaRecorder {
  static instances: FakeMediaRecorder[] = [];
  static isTypeSupported = vi.fn(() => true);

  stream: MediaStream;
  options: MediaRecorderOptions | undefined;
  state: 'inactive' | 'recording' | 'paused' = 'inactive';
  mimeType: string;
  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  finalChunks: Blob[] = [new Blob(['payload'], { type: 'video/webm' })];

  constructor(stream: MediaStream, options?: MediaRecorderOptions) {
    this.stream = stream;
    this.options = options;
    this.mimeType = options?.mimeType ?? 'video/webm;codecs=vp8,opus';
    FakeMediaRecorder.instances.push(this);
  }

  start = vi.fn(() => {
    this.state = 'recording';
  });

  stop = vi.fn(() => {
    if (this.state === 'inactive') return;
    this.state = 'inactive';
    this.finalChunks.forEach((data) => this.emitData(data));
    this.onstop?.();
  });

  emitData = (data: Blob) => {
    this.ondataavailable?.(fromPartial<BlobEvent>({ data }));
  };
}

const lastRecorder = () =>
  FakeMediaRecorder.instances[FakeMediaRecorder.instances.length - 1];

describe('MediaStreamRecorder', () => {
  let logger: { debug: any; warn: any; error: any };

  beforeEach(() => {
    FakeMediaRecorder.instances = [];
    vi.stubGlobal('MediaRecorder', FakeMediaRecorder);
    vi.stubGlobal('MediaStream', FakeMediaStream);
    logger = { debug: vi.fn(), warn: vi.fn(), error: vi.fn() };
    vi.spyOn(videoLoggerSystem, 'getLogger').mockReturnValue(
      fromPartial(logger),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('construction', () => {
    it('throws when MediaRecorder is unavailable', () => {
      vi.stubGlobal('MediaRecorder', undefined);
      expect(
        () => new MediaStreamRecorder(createStream(createTrack())),
      ).toThrow(/MediaRecorder is not available/);
    });

    it('throws when the stream has no tracks', () => {
      expect(() => new MediaStreamRecorder(createStream())).toThrow(
        /has no tracks/,
      );
    });

    it('lets the browser choose the recording MIME type', () => {
      new MediaStreamRecorder(createStream(createTrack()));

      expect(lastRecorder().options).toBeUndefined();
    });

    it('does not start recording until `start` is called', () => {
      new MediaStreamRecorder(createStream(createTrack()));

      expect(lastRecorder().start).not.toHaveBeenCalled();
    });

    it('creates no DOM elements of its own', () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      recorder.start();
      expect(document.querySelectorAll('video, audio')).toHaveLength(0);
    });

    it('records a snapshot, so mutating the caller stream cannot disturb it', () => {
      const track = createTrack();
      const stream = createStream(track);
      new MediaStreamRecorder(stream);

      stream.addTrack(createTrack('audio'));

      expect(lastRecorder().stream).not.toBe(stream);
      expect(lastRecorder().stream.getTracks()).toEqual([track]);
    });
  });

  describe('recording', () => {
    it('resolves with the recorded blob', async () => {
      vi.useFakeTimers();
      const recorder = new MediaStreamRecorder(createStream(createTrack()));

      const recording = recorder.start();
      vi.advanceTimersByTime(2500);
      recorder.stop();

      const result = await recording;

      expect(result?.blob.size).toBeGreaterThan(0);
      expect(result?.blob.type).toBe('video/webm');
    });

    it('hands every awaiter of `start` the same result', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));

      const first = recorder.start();
      const second = recorder.start();
      recorder.stop();

      expect(await first).toBe(await second);
      expect(lastRecorder().start).toHaveBeenCalledTimes(1);
    });

    it('sets the blob type from the recorder when the chunk carries none', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      lastRecorder().finalChunks = [new Blob(['payload'])];

      const recording = recorder.start();
      recorder.stop();

      expect((await recording)?.blob.type).toBe('video/webm;codecs=vp8,opus');
    });

    it('keeps chunks that arrive before stop', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      const recording = recorder.start();
      lastRecorder().emitData(new Blob(['early'], { type: 'video/webm' }));

      recorder.stop();

      expect((await recording)?.blob.size).toBe(12);
    });

    it('ignores empty chunks', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      const recording = recorder.start();
      lastRecorder().emitData(new Blob([]));
      lastRecorder().finalChunks = [];

      recorder.stop();

      await expect(recording).resolves.toBeNull();
    });

    it('resolves null and warns when nothing was captured', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      lastRecorder().finalChunks = [];

      const recording = recorder.start();
      recorder.stop();

      await expect(recording).resolves.toBeNull();
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('recording produced no data'),
      );
    });

    it('never stops the tracks it was handed', async () => {
      const track = createTrack();
      const recorder = new MediaStreamRecorder(createStream(track));

      const recording = recorder.start();
      recorder.stop();
      await recording;

      expect(track.stop).not.toHaveBeenCalled();
    });
  });

  describe('auto-stop', () => {
    it('stops once maxDurationMs elapses', async () => {
      vi.useFakeTimers();
      const recorder = new MediaStreamRecorder(createStream(createTrack()), {
        maxDurationMs: 5000,
      });

      const recording = recorder.start();
      vi.advanceTimersByTime(5000);

      await expect(recording).resolves.toMatchObject({
        blob: expect.any(Blob),
      });
    });

    it('runs indefinitely when maxDurationMs is omitted', async () => {
      vi.useFakeTimers();
      const recorder = new MediaStreamRecorder(createStream(createTrack()));

      const recording = recorder.start();
      vi.advanceTimersByTime(10 * 60 * 1000);

      expect(lastRecorder().stop).not.toHaveBeenCalled();
      recorder.stop();
      await recording;
    });

    it('stops when any source track ends, keeping what was captured', async () => {
      const audioTrack = createTrack('audio');
      const recorder = new MediaStreamRecorder(
        createStream(createTrack(), audioTrack),
      );

      const recording = recorder.start();
      audioTrack.dispatchEvent(new Event('ended'));

      await expect(recording).resolves.toMatchObject({
        blob: expect.any(Blob),
      });
    });

    it('resolves when the user agent stops the recorder on its own', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      const recording = recorder.start();

      lastRecorder().stop();

      await expect(recording).resolves.toMatchObject({
        blob: expect.any(Blob),
      });
    });
  });

  describe('lifecycle guards', () => {
    it('is a no-op when stopped before it was started', () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));

      expect(() => recorder.stop()).not.toThrow();
      expect(lastRecorder().stop).not.toHaveBeenCalled();
      expect(lastRecorder().start).not.toHaveBeenCalled();
    });

    it('throws when restarted after finishing', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      const recording = recorder.start();
      recorder.stop();
      await recording;

      expect(() => recorder.start()).toThrow(/single-use/);
    });

    it('is idempotent across repeated stops', async () => {
      const recorder = new MediaStreamRecorder(createStream(createTrack()));
      const recording = recorder.start();

      recorder.stop();
      recorder.stop();

      await expect(recording).resolves.toMatchObject({
        blob: expect.any(Blob),
      });
      expect(lastRecorder().stop).toHaveBeenCalledTimes(1);
    });
  });

  it('leaves no timer or listener behind after finishing', async () => {
    vi.useFakeTimers();
    const track = createTrack();
    const recorder = new MediaStreamRecorder(createStream(track), {
      maxDurationMs: 5000,
    });

    const recording = recorder.start();
    recorder.stop();
    const result = await recording;

    expect(() => {
      vi.advanceTimersByTime(10_000);
      track.dispatchEvent(new Event('ended'));
    }).not.toThrow();
    expect(lastRecorder().stop).toHaveBeenCalledTimes(1);
    expect(result?.blob).toBeInstanceOf(Blob);
  });
});
