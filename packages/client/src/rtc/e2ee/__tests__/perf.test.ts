import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const postMessage = vi.fn();
vi.stubGlobal('self', { postMessage });

const { decodeStats, encodeStats, startPerfReport, stopPerfReport } =
  await import('../e2ee-worker/perf');

const encodeTrack = (trackType: string, userId = 'alice') =>
  encodeStats.track(trackType, { userId, trackType, codec: 'vp8' });
const decodeTrack = (userId: string, trackType = 'VIDEO') =>
  decodeStats.track(`${userId}/${trackType}`, { userId, trackType });

beforeEach(() => {
  vi.useFakeTimers();
  postMessage.mockClear();
});

afterEach(() => {
  stopPerfReport();
  vi.useRealTimers();
});

describe('while reporting is off', () => {
  it('records nothing, so the transforms need no guard of their own', () => {
    const track = encodeTrack('VIDEO');
    track.bump();
    track.endCrypto(track.startCrypto());
    expect(encodeStats.flush(1)).toEqual([]);
  });
});

describe('counting', () => {
  beforeEach(() => startPerfReport());

  it('reports each track separately, as a rate over the elapsed window', () => {
    // Two tracks on one sender: a vp8 camera and a vp8 screen share must be
    // reported apart rather than summed.
    const camera = encodeTrack('VIDEO');
    camera.bump();
    camera.bump();
    camera.bump();
    encodeTrack('SCREEN_SHARE').bump();

    expect(encodeStats.flush(1.5)).toEqual([
      {
        userId: 'alice',
        trackType: 'VIDEO',
        codec: 'vp8',
        fps: 2,
        maxCryptoMs: 0,
      },
      {
        userId: 'alice',
        trackType: 'SCREEN_SHARE',
        codec: 'vp8',
        fps: 1 / 1.5,
        maxCryptoMs: 0,
      },
    ]);
  });

  it('drops an idle track from the next report instead of reporting 0 fps', () => {
    // The accumulator is created on demand and cleared by flush, so a track
    // that stops delivering disappears rather than reporting zeroes forever.
    const track = encodeTrack('VIDEO');
    track.bump();
    expect(encodeStats.flush(1)).toHaveLength(1);
    expect(encodeStats.flush(1)).toHaveLength(0);
    // ...and it comes back as soon as it delivers again.
    track.bump();
    expect(encodeStats.flush(1)).toHaveLength(1);
  });

  it('takes the worst crypto time seen in the window', () => {
    const track = encodeTrack('VIDEO');
    const slow = track.startCrypto();
    vi.advanceTimersByTime(7);
    track.endCrypto(slow);
    const fast = track.startCrypto();
    vi.advanceTimersByTime(2);
    track.endCrypto(fast);
    expect(encodeStats.flush(1)[0].maxCryptoMs).toBe(7);
  });

  it('labels decode samples without a codec', () => {
    // A remote sender's codec is not reliably known locally, so decode rows
    // carry only (userId, trackType).
    decodeTrack('bob').bump();
    expect(decodeStats.flush(1)).toEqual([
      { userId: 'bob', trackType: 'VIDEO', fps: 1, maxCryptoMs: 0 },
    ]);
  });

  it('removeUser drops that user rows and leaves the others', () => {
    decodeTrack('bob').bump();
    decodeTrack('carol').bump();
    decodeStats.removeUser('bob');
    expect(decodeStats.flush(1).map((s) => s.userId)).toEqual(['carol']);
  });
});

describe('the reporting interval', () => {
  it('posts one report per second with both directions', () => {
    startPerfReport();
    encodeTrack('VIDEO').bump();
    decodeTrack('bob').bump();

    vi.advanceTimersByTime(1000);

    expect(postMessage).toHaveBeenCalledTimes(1);
    const report = postMessage.mock.calls[0][0];
    expect(report.type).toBe('e2ee.perf_report');
    expect(report.encode).toHaveLength(1);
    expect(report.decode).toHaveLength(1);
  });

  it('is idempotent: a second start does not add a second interval', () => {
    startPerfReport();
    startPerfReport();
    startPerfReport();
    encodeTrack('VIDEO').bump();

    vi.advanceTimersByTime(1000);

    // A leaked interval would post the same window several times over.
    expect(postMessage).toHaveBeenCalledTimes(1);
  });

  it('stops the interval and clears the counters on stop', () => {
    startPerfReport();
    encodeTrack('VIDEO').bump();
    stopPerfReport();

    expect(encodeStats.flush(1)).toEqual([]);
    vi.advanceTimersByTime(5000);
    expect(postMessage).not.toHaveBeenCalled();
  });
});
