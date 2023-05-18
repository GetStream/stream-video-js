import './mocks/webrtc.mocks';
import { describe, expect, it, vi } from 'vitest';
import {
  findOptimalScreenSharingLayers,
  findOptimalVideoLayers,
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

    const layers = findOptimalVideoLayers(track, targetBitrate);
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
});
