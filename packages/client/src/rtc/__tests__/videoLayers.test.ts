import './mocks/webrtc.mocks';
import { describe, expect, it, vi } from 'vitest';
import {
  findOptimalScreenSharingLayers,
  findOptimalVideoLayers,
  getComputedMaxBitrate,
} from '../videoLayers';

describe('videoLayers', () => {
  it('should find optimal screen sharing layers', () => {
    const track = new MediaStreamTrack();
    vi.spyOn(track, 'getSettings').mockReturnValue({
      width: 1920,
      height: 1080,
    });

    const layers = findOptimalScreenSharingLayers(track);
    expect(layers).toEqual([
      {
        active: true,
        rid: 'q',
        width: 1920,
        height: 1080,
        maxBitrate: 3000000,
        scaleResolutionDownBy: 1,
        maxFramerate: 30,
      },
    ]);
  });

  it('should find optimal video layers', () => {
    const track = new MediaStreamTrack();
    const width = 1920;
    const height = 1080;
    const targetBitrate = 3000000;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });

    const layers = findOptimalVideoLayers(track, {
      width,
      height,
      bitrate: targetBitrate,
    });
    expect(layers).toEqual([
      {
        active: true,
        rid: 'q',
        width: width / 4,
        height: height / 4,
        maxBitrate: targetBitrate / 4,
        scaleResolutionDownBy: 4,
        maxFramerate: 20,
      },
      {
        active: true,
        rid: 'h',
        width: width / 2,
        height: height / 2,
        maxBitrate: targetBitrate / 2,
        scaleResolutionDownBy: 2,
        maxFramerate: 25,
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

  it('should announce one simulcast layer for resolutions less than 320px wide', () => {
    const track = new MediaStreamTrack();
    const width = 320;
    const height = 240;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });
    const layers = findOptimalVideoLayers(track);
    expect(layers.length).toBe(1);
    expect(layers[0].rid).toBe('q');
  });

  it('should announce two simulcast layers for resolutions less than 640px wide', () => {
    const track = new MediaStreamTrack();
    const width = 640;
    const height = 480;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });
    const layers = findOptimalVideoLayers(track);
    expect(layers.length).toBe(2);
    expect(layers[0].rid).toBe('q');
    expect(layers[1].rid).toBe('h');
  });

  it('should announce three simulcast layers for resolutions greater than 640px wide', () => {
    const track = new MediaStreamTrack();
    const width = 1280;
    const height = 720;
    vi.spyOn(track, 'getSettings').mockReturnValue({ width, height });
    const layers = findOptimalVideoLayers(track);
    expect(layers.length).toBe(3);
    expect(layers[0].rid).toBe('q');
    expect(layers[1].rid).toBe('h');
    expect(layers[2].rid).toBe('f');
  });

  describe('getComputedMaxBitrate', () => {
    it('should scale target bitrate down if resolution is smaller than target resolution', () => {
      const targetResolution = { width: 1920, height: 1080, bitrate: 3000000 };
      const scaledBitrate = getComputedMaxBitrate(targetResolution, 1280, 720);
      expect(scaledBitrate).toBe(1333333);
    });

    it('should not scale target bitrate if resolution is larger than target resolution', () => {
      const targetResolution = { width: 1280, height: 720, bitrate: 1000000 };
      const scaledBitrate = getComputedMaxBitrate(targetResolution, 2560, 1440);
      expect(scaledBitrate).toBe(1000000);
    });

    it('should not scale target bitrate if resolution is equal to target resolution', () => {
      const targetResolution = { width: 1280, height: 720, bitrate: 1000000 };
      const scaledBitrate = getComputedMaxBitrate(targetResolution, 1280, 720);
      expect(scaledBitrate).toBe(1000000);
    });

    it('should handle 0 width and height', () => {
      const targetResolution = { width: 1280, height: 720, bitrate: 1000000 };
      const scaledBitrate = getComputedMaxBitrate(targetResolution, 0, 0);
      expect(scaledBitrate).toBe(0);
    });

    it('should handle 4k target resolution', () => {
      const targetResolution = { width: 3840, height: 2160, bitrate: 15000000 };
      const scaledBitrate = getComputedMaxBitrate(targetResolution, 1280, 720);
      expect(scaledBitrate).toBe(1666667);
    });
  });
});
