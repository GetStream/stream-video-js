import './mocks/webrtc.mocks';
import { describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  AudioBitrateProfile,
  PublishOption,
  TrackType,
  VideoQuality,
} from '../../gen/video/sfu/models/models';
import {
  computeAudioLayers,
  computeVideoLayers,
  getComputedMaxBitrate,
  OptimalVideoLayer,
  ridToVideoQuality,
  toSvcEncodings,
  toVideoLayers,
} from '../layers';

describe('videoLayers', () => {
  it('should find optimal video layers', () => {
    const track = new MediaStreamTrack();
    const width = 1920;
    const height = 1080;
    const targetBitrate = 3000000;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });

    const publishOption: PublishOption = fromPartial({
      bitrate: targetBitrate,
      codec: { name: 'vp8' },
      videoDimension: { width, height },
      fps: 30,
    });
    const layers = computeVideoLayers(track, publishOption);
    expect(layers).toEqual([
      {
        active: true,
        rid: 'q',
        width: width / 4,
        height: height / 4,
        maxBitrate: targetBitrate / 4,
        scaleResolutionDownBy: 4,
        maxFramerate: 30,
      },
      {
        active: true,
        rid: 'h',
        width: width / 2,
        height: height / 2,
        maxBitrate: targetBitrate / 2,
        scaleResolutionDownBy: 2,
        maxFramerate: 30,
      },
      {
        active: true,
        rid: 'f',
        width: width,
        height: height,
        maxBitrate: targetBitrate,
        scaleResolutionDownBy: 1,
        maxFramerate: 30,
      },
    ]);
  });

  it('should return undefined for audio track', () => {
    const track = new MediaStreamTrack();
    expect(
      computeVideoLayers(track, fromPartial({ trackType: TrackType.AUDIO })),
    ).toBeUndefined();
    expect(
      computeVideoLayers(
        track,
        fromPartial({ trackType: TrackType.SCREEN_SHARE_AUDIO }),
      ),
    ).toBeUndefined();
  });

  it('should use predefined bitrate values when track dimensions cant be determined', () => {
    const bitrate = 3000000;
    const track = new MediaStreamTrack();
    vi.spyOn(track, 'getSettings').mockReturnValue({});
    const layers = computeVideoLayers(
      track,
      fromPartial({
        bitrate,
        codec: { name: 'vp8' },
        fps: 30,
        videoDimension: { width: 320, height: 180 },
      }),
    );
    expect(layers).toEqual([
      {
        active: true,
        rid: 'q',
        width: 320,
        height: 180,
        maxBitrate: bitrate,
        scaleResolutionDownBy: 1,
        maxFramerate: 30,
      },
    ]);
  });

  it('should announce one simulcast layer for resolutions less than 320px wide', () => {
    const track = new MediaStreamTrack();
    const width = 320;
    const height = 240;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });
    const layers = computeVideoLayers(
      track,
      fromPartial({
        bitrate: 0,
        codec: { name: 'vp8' },
        fps: 30,
        videoDimension: { width, height },
      }),
    );
    expect(layers.length).toBe(1);
    const [q] = layers;
    expect(q.rid).toBe('q');
    expect(q.width).toBe(320);
    expect(q.height).toBe(240);
  });

  it('should announce two simulcast layers for resolutions less than 640px wide', () => {
    const track = new MediaStreamTrack();
    const width = 640;
    const height = 480;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });
    const layers = computeVideoLayers(
      track,
      fromPartial({
        bitrate: 0,
        codec: { name: 'vp8' },
        fps: 30,
        videoDimension: { width, height },
      }),
    );
    expect(layers.length).toBe(2);
    const [q, h] = layers;
    expect(q.rid).toBe('q');
    expect(q.width).toBe(320);
    expect(q.height).toBe(240);
    expect(h.rid).toBe('h');
    expect(h.width).toBe(640);
    expect(h.height).toBe(480);
  });

  it('should announce three simulcast layers for resolutions greater than 640px wide', () => {
    const track = new MediaStreamTrack();
    const width = 1280;
    const height = 720;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });
    const layers = computeVideoLayers(
      track,
      fromPartial({
        bitrate: 0,
        codec: { name: 'vp8' },
        fps: 30,
        videoDimension: { width, height },
      }),
    );
    expect(layers.length).toBe(3);
    const [q, h, f] = layers;
    expect(q.rid).toBe('q');
    expect(q.width).toBe(320);
    expect(q.height).toBe(180);
    expect(h.rid).toBe('h');
    expect(h.width).toBe(640);
    expect(h.height).toBe(360);
    expect(f.rid).toBe('f');
    expect(f.width).toBe(1280);
    expect(f.height).toBe(720);
  });

  it('should announce only one layer for SVC codecs', () => {
    const track = new MediaStreamTrack();
    vi.spyOn(track, 'getSettings').mockReturnValue({
      width: 1280,
      height: 720,
    });
    const layers = computeVideoLayers(
      track,
      fromPartial({
        maxTemporalLayers: 3,
        maxSpatialLayers: 3,
        codec: { name: 'vp9' },
        videoDimension: { width: 1280, height: 720 },
      }),
    );
    expect(layers.length).toBe(3);
    expect(layers[0].scalabilityMode).toBe('L3T3_KEY');
    expect(layers[0].rid).toBe('q');
    expect(layers[1].rid).toBe('h');
    expect(layers[2].rid).toBe('f');
  });

  it('should activate only a single layer when useSingleLayer is true', () => {
    const track = new MediaStreamTrack();
    const layers = computeVideoLayers(
      track,
      fromPartial({ useSingleLayer: true }),
    );
    expect(layers.length).toBe(3);
    expect(layers[0].active).toBe(false);
    expect(layers[0].rid).toBe('q');
    expect(layers[1].active).toBe(false);
    expect(layers[1].rid).toBe('h');
    expect(layers[2].active).toBe(true);
    expect(layers[2].rid).toBe('f');
  });

  it('should activate only a single layer when useSingleLayer is true in single layer mode', () => {
    const track = new MediaStreamTrack();
    vi.spyOn(track, 'getSettings').mockReturnValue({ width: 320, height: 180 });
    const layers = computeVideoLayers(
      track,
      fromPartial({ useSingleLayer: true }),
    );
    expect(layers.length).toBe(1);
    expect(layers[0].active).toBe(true);
    expect(layers[0].rid).toBe('q');
  });

  it('should activate only one temporal layer when useSingleLayer is true for SVC', () => {
    const track = new MediaStreamTrack();
    const layers = computeVideoLayers(
      track,
      fromPartial({
        codec: { name: 'vp9' },
        maxSpatialLayers: 3,
        maxTemporalLayers: 3,
        useSingleLayer: true,
      }),
    );
    expect(layers.length).toBe(3);
    expect(layers[0].rid).toBe('q');
    expect(layers[0].active).toBe(false);
    expect(layers[0].scalabilityMode).toBe('L1T3');
    expect(layers[1].active).toBe(false);
    expect(layers[1].rid).toBe('h');
    expect(layers[1].scalabilityMode).toBe('L1T3');
    expect(layers[2].active).toBe(true);
    expect(layers[2].rid).toBe('f');
    expect(layers[2].scalabilityMode).toBe('L1T3');
  });

  it('should map rids to VideoQuality', () => {
    expect(ridToVideoQuality('q')).toBe(VideoQuality.LOW_UNSPECIFIED);
    expect(ridToVideoQuality('h')).toBe(VideoQuality.MID);
    expect(ridToVideoQuality('f')).toBe(VideoQuality.HIGH);
    expect(ridToVideoQuality('')).toBe(VideoQuality.HIGH);
  });

  it('should map optimal video layers to SFU VideoLayers', () => {
    const layers: Array<Partial<OptimalVideoLayer>> = [
      { rid: 'f', width: 1920, height: 1080, maxBitrate: 3000000 },
      { rid: 'h', width: 960, height: 540, maxBitrate: 750000 },
      { rid: 'q', width: 480, height: 270, maxBitrate: 187500 },
    ];

    const videoLayers = toVideoLayers(layers as OptimalVideoLayer[]);
    expect(videoLayers.length).toBe(3);
    expect(videoLayers[0]).toEqual({
      rid: 'f',
      bitrate: 3000000,
      fps: 0,
      quality: VideoQuality.HIGH,
      videoDimension: { width: 1920, height: 1080 },
    });
    expect(videoLayers[1]).toEqual({
      rid: 'h',
      bitrate: 750000,
      fps: 0,
      quality: VideoQuality.MID,
      videoDimension: { width: 960, height: 540 },
    });
    expect(videoLayers[2]).toEqual({
      rid: 'q',
      bitrate: 187500,
      fps: 0,
      quality: VideoQuality.LOW_UNSPECIFIED,
      videoDimension: { width: 480, height: 270 },
    });
  });

  it('should map OptimalVideoLayer to SVC encodings (three layers)', () => {
    const layers: Array<Partial<OptimalVideoLayer>> = [
      { rid: 'f', width: 1920, height: 1080, maxBitrate: 3000000 },
      { rid: 'h', width: 960, height: 540, maxBitrate: 750000 },
      { rid: 'q', width: 480, height: 270, maxBitrate: 187500 },
    ];

    const svcLayers = toSvcEncodings(layers as OptimalVideoLayer[]);
    expect(svcLayers.length).toBe(1);
    expect(svcLayers[0]).toEqual({
      rid: 'q',
      width: 1920,
      height: 1080,
      maxBitrate: 3000000,
    });
  });

  it('should map OptimalVideoLayer to SVC encodings (two layers)', () => {
    const layers: Array<Partial<OptimalVideoLayer>> = [
      { rid: 'h', width: 960, height: 540, maxBitrate: 750000 },
      { rid: 'q', width: 480, height: 270, maxBitrate: 187500 },
    ];

    const svcLayers = toSvcEncodings(layers as OptimalVideoLayer[]);
    expect(svcLayers.length).toBe(1);
    expect(svcLayers[0]).toEqual({
      rid: 'q',
      width: 960,
      height: 540,
      maxBitrate: 750000,
    });
  });

  it('should map OptimalVideoLayer to SVC encodings (two layers)', () => {
    const layers: Array<Partial<OptimalVideoLayer>> = [
      { rid: 'q', width: 480, height: 270, maxBitrate: 187500 },
    ];

    const svcLayers = toSvcEncodings(layers as OptimalVideoLayer[]);
    expect(svcLayers.length).toBe(1);
    expect(svcLayers[0]).toEqual({
      rid: 'q',
      width: 480,
      height: 270,
      maxBitrate: 187500,
    });
  });

  it('should use integer for maxBitrate', () => {
    const track = new MediaStreamTrack();
    const layers = computeVideoLayers(
      track,
      fromPartial({
        bitrate: 2999777,
        codec: { name: 'vp8' },
        videoDimension: { width: 1920, height: 1080 },
        fps: 30,
      }),
    );
    expect(layers).toBeDefined();
    for (const layer of layers!) {
      expect(Number.isInteger(layer.width)).toBe(true);
      expect(Number.isInteger(layer.height)).toBe(true);
      expect(Number.isInteger(layer.maxBitrate)).toBe(true);
    }
  });

  describe('getComputedMaxBitrate', () => {
    it('should scale target bitrate down if resolution is smaller than target resolution', () => {
      const targetResolution = { width: 1920, height: 1080, bitrate: 3000000 };
      const scaledBitrate = getComputedMaxBitrate(
        targetResolution,
        1280,
        720,
        3000000,
      );
      expect(scaledBitrate).toBe(1333333);
    });

    it('should scale target bitrate down for all simulcast tracks', () => {
      const targetResolution = { width: 1920, height: 1080, bitrate: 3000000 };
      let downscaleFactor = 1;
      const targetBitrates = ['f', 'h', 'q'].map((rid) => {
        const width = targetResolution.width / downscaleFactor;
        const height = targetResolution.height / downscaleFactor;
        const bitrate = getComputedMaxBitrate(
          targetResolution,
          width,
          height,
          3000000,
        );
        downscaleFactor *= 2;
        return {
          rid,
          bitrate,
          width,
          height,
        };
      });
      expect(targetBitrates).toEqual([
        { rid: 'f', bitrate: 3000000, width: 1920, height: 1080 },
        { rid: 'h', bitrate: 750000, width: 960, height: 540 },
        { rid: 'q', bitrate: 187500, width: 480, height: 270 },
      ]);
    });

    it('should not scale target bitrate if resolution is larger than target resolution', () => {
      const targetResolution = { width: 1280, height: 720, bitrate: 1000000 };
      const scaledBitrate = getComputedMaxBitrate(
        targetResolution,
        2560,
        1440,
        1000000,
      );
      expect(scaledBitrate).toBe(1000000);
    });

    it('should not scale target bitrate if resolution is equal to target resolution', () => {
      const targetResolution = { width: 1280, height: 720, bitrate: 1000000 };
      const scaledBitrate = getComputedMaxBitrate(
        targetResolution,
        1280,
        720,
        1000000,
      );
      expect(scaledBitrate).toBe(1000000);
    });

    it('should handle 0 width and height', () => {
      const targetResolution = { width: 1280, height: 720, bitrate: 1000000 };
      const scaledBitrate = getComputedMaxBitrate(
        targetResolution,
        0,
        0,
        1000000,
      );
      expect(scaledBitrate).toBe(0);
    });

    it('should handle 4k target resolution', () => {
      const targetResolution = { width: 3840, height: 2160, bitrate: 15000000 };
      const scaledBitrate = getComputedMaxBitrate(
        targetResolution,
        1280,
        720,
        15000000,
      );
      expect(scaledBitrate).toBe(1666667);
    });
  });
});

describe('audioLayers', () => {
  it('should use predefined bitrates when publish options are missing', () => {
    expect(
      computeAudioLayers(
        fromPartial({
          trackType: TrackType.AUDIO,
          id: 1,
          audioBitrateProfiles: [],
        }),
        { audioBitrateProfile: AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED },
      ),
    ).toEqual([{ maxBitrate: 64000 }]);
    expect(
      computeAudioLayers(
        fromPartial({
          trackType: TrackType.AUDIO,
          id: 1,
          audioBitrateProfiles: [],
        }),
        { audioBitrateProfile: AudioBitrateProfile.VOICE_HIGH_QUALITY },
      ),
    ).toEqual([{ maxBitrate: 128000 }]);
    expect(
      computeAudioLayers(
        fromPartial({
          trackType: TrackType.AUDIO,
          id: 1,
          audioBitrateProfiles: [],
        }),
        { audioBitrateProfile: AudioBitrateProfile.MUSIC_HIGH_QUALITY },
      ),
    ).toEqual([{ maxBitrate: 128000 }]);
  });

  it('should use the predefined bitrate when the SFU does not provide audioBitrateProfiles', () => {
    expect(
      computeAudioLayers(fromPartial({ trackType: TrackType.AUDIO, id: 1 }), {
        audioBitrateProfile: AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED,
      }),
    ).toEqual([{ maxBitrate: 64000 }]);
  });

  it('should respect the bitrates provided in publish options', () => {
    const config: PublishOption = fromPartial({
      trackType: TrackType.AUDIO,
      id: 1,
      audioBitrateProfiles: [
        {
          profile: AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED,
          bitrate: 32000,
        },
        {
          profile: AudioBitrateProfile.VOICE_HIGH_QUALITY,
          bitrate: 96000,
        },
        {
          profile: AudioBitrateProfile.MUSIC_HIGH_QUALITY,
          bitrate: 192000,
        },
      ],
    });
    expect(
      computeAudioLayers(config, {
        audioBitrateProfile: AudioBitrateProfile.VOICE_STANDARD_UNSPECIFIED,
      }),
    ).toEqual([{ maxBitrate: 32000 }]);
    expect(
      computeAudioLayers(config, {
        audioBitrateProfile: AudioBitrateProfile.VOICE_HIGH_QUALITY,
      }),
    ).toEqual([{ maxBitrate: 96000 }]);
    expect(
      computeAudioLayers(config, {
        audioBitrateProfile: AudioBitrateProfile.MUSIC_HIGH_QUALITY,
      }),
    ).toEqual([{ maxBitrate: 192000 }]);
  });
});
