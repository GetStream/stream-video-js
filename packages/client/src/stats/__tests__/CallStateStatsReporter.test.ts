import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createStatsReporter, StatsReporter } from '../CallStateStatsReporter';
import { CallState } from '../../store';
import type { CallStatsReport } from '../types';
import type { Publisher, Subscriber } from '../../rtc';
import { TrackType } from '../../gen/video/sfu/models/models';

type CameraTrack = MediaStreamTrack & {
  stats?: { deliveredFrames: number };
};

const createCameraTrack = (id: string, deliveredFrames?: number) =>
  ({
    id,
    kind: 'video',
    getSettings: () => ({ width: 1280, height: 720 }),
    stats: deliveredFrames === undefined ? undefined : { deliveredFrames },
  }) as unknown as CameraTrack;

const streamOf = (track: MediaStreamTrack) =>
  ({ getVideoTracks: () => [track] }) as unknown as MediaStream;

describe('CallStateStatsReporter camera capture stats', () => {
  let state: CallState;
  let reporter: StatsReporter | undefined;
  let reports: Array<CallStatsReport | undefined>;
  let unsubscribe: () => void;
  let cameraState: {
    mediaStream: MediaStream | undefined;
    rootMediaStream: MediaStream | undefined;
  };

  const subscriber = {
    getStats: async () => new Map(),
  } as unknown as Subscriber;

  // the published (encoder input) video: 640x360 at 10 fps
  const publisher = {
    getStats: async () =>
      new Map<string, object>([
        [
          'out',
          { type: 'outbound-rtp', kind: 'video', mediaSourceId: 'source' },
        ],
        [
          'source',
          {
            type: 'media-source',
            id: 'source',
            kind: 'video',
            trackIdentifier: 'published',
            framesPerSecond: 10,
            width: 640,
            height: 360,
          },
        ],
      ]),
    getTrackType: () => TrackType.VIDEO,
  } as unknown as Publisher;
  const encoderInput = { frameRate: 10, frameWidth: 640, frameHeight: 360 };

  const start = async () => {
    reporter = createStatsReporter({
      subscriber,
      publisher,
      state,
      datacenter: 'test',
      pollingIntervalInMs: 2000,
      cameraState,
    });
    await vi.advanceTimersByTimeAsync(0);
  };

  const latestCamera = () => reports.at(-1)?.publisherStats.camera;
  const latestCapture = () => reports.at(-1)?.publisherStats.cameraCapture;

  beforeEach(() => {
    vi.useFakeTimers();
    state = new CallState();
    cameraState = { mediaStream: undefined, rootMediaStream: undefined };
    reports = [];
    const subscription = state.callStatsReport$.subscribe((report) =>
      reports.push(report),
    );
    unsubscribe = () => subscription.unsubscribe();
  });

  afterEach(() => {
    reporter?.stop();
    unsubscribe();
    vi.useRealTimers();
  });

  it('mirrors the camera stats when no filters are applied', async () => {
    const stream = streamOf(createCameraTrack('camera', 100));
    cameraState.mediaStream = stream;
    cameraState.rootMediaStream = stream;

    await start();

    expect(latestCamera()).toEqual(encoderInput);
    expect(latestCapture()).toEqual(encoderInput);
  });

  it('is undefined while the camera is off', async () => {
    await start();

    expect(latestCamera()).toEqual(encoderInput);
    expect(latestCapture()).toBeUndefined();
  });

  it('reports the raw camera frame rate when filters are applied', async () => {
    const track = createCameraTrack('camera', 100);
    cameraState.rootMediaStream = streamOf(track);
    cameraState.mediaStream = streamOf(createCameraTrack('filtered'));

    await start();
    expect(latestCapture()).toEqual({ frameWidth: 1280, frameHeight: 720 });

    track.stats = { deliveredFrames: 160 };
    await vi.advanceTimersByTimeAsync(2000);
    expect(latestCapture()).toEqual({
      frameWidth: 1280,
      frameHeight: 720,
      frameRate: 30,
    });
  });

  it('keeps the camera stats describing the encoder input when filters are applied', async () => {
    cameraState.rootMediaStream = streamOf(createCameraTrack('camera', 100));
    cameraState.mediaStream = streamOf(createCameraTrack('filtered'));

    await start();

    expect(latestCamera()).toEqual(encoderInput);
  });

  it('leaves the frame rate undefined without camera frame counters', async () => {
    cameraState.rootMediaStream = streamOf(createCameraTrack('camera'));
    cameraState.mediaStream = streamOf(createCameraTrack('filtered'));

    await start();
    await vi.advanceTimersByTimeAsync(2000);

    expect(latestCapture()).toEqual({ frameWidth: 1280, frameHeight: 720 });
  });

  it('starts over when the camera track changes', async () => {
    cameraState.rootMediaStream = streamOf(createCameraTrack('camera-1', 100));
    cameraState.mediaStream = streamOf(createCameraTrack('filtered'));

    await start();
    cameraState.rootMediaStream = streamOf(createCameraTrack('camera-2', 10));
    await vi.advanceTimersByTimeAsync(2000);

    expect(latestCapture()?.frameRate).toBeUndefined();
  });
});
