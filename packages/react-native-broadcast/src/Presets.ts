import type { Preset } from './NativeBroadcast';

export class Presets {
  /**
   * HD portrait mode preset. Recommended for most use cases.
   */
  static PORTRAIT_HD: Preset = {
    width: 720,
    height: 1280,
    frameRate: 30,
    videoBitrate: 3_000_000,
    audioBitrate: 128_000,
  };

  /**
   * Full HD portrait mode preset. Recommended for high-resolution broadcasts,
   * but it can be slow on older devices.
   */
  static PORTRAIT_FULL_HD: Preset = {
    width: 1080,
    height: 1920,
    frameRate: 30,
    videoBitrate: 4_000_000,
    audioBitrate: 128_000,
  };
}
