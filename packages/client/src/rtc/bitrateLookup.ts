import { PreferredCodec } from '../types';

const bitrateLookupTable: Record<
  PreferredCodec,
  Record<number | 'default', number | undefined> | undefined
> = {
  h264: {
    2160: 5_000_000,
    1440: 3_000_000,
    1080: 2_000_000,
    720: 1_250_000,
    540: 750_000,
    360: 400_000,
    default: 1_250_000,
  },
  vp8: {
    2160: 5_000_000,
    1440: 2_750_000,
    1080: 2_000_000,
    720: 1_250_000,
    540: 600_000,
    360: 350_000,
    default: 1_250_000,
  },
  vp9: {
    2160: 3_000_000,
    1440: 2_000_000,
    1080: 1_500_000,
    720: 1_250_000,
    540: 500_000,
    360: 275_000,
    default: 1_250_000,
  },
  av1: {
    2160: 2_000_000,
    1440: 1_550_000,
    1080: 1_000_000,
    720: 600_000,
    540: 350_000,
    360: 200_000,
    default: 600_000,
  },
};

export const getOptimalBitrate = (
  codec: PreferredCodec,
  frameHeight: number,
): number => {
  const codecLookup = bitrateLookupTable[codec];
  if (!codecLookup) throw new Error(`Unknown codec: ${codec}`);

  let bitrate = codecLookup[frameHeight];
  if (!bitrate) {
    const keys = Object.keys(codecLookup).map(Number);
    const nearest = keys.reduce((a, b) =>
      Math.abs(b - frameHeight) < Math.abs(a - frameHeight) ? b : a,
    );
    bitrate = codecLookup[nearest];
  }
  return bitrate ?? codecLookup.default!;
};
