import { PreferredCodec } from '@stream-io/video-react-sdk';

const lookup: Record<PreferredCodec, Record<number, number> | undefined> = {
  h264: {
    1080: 2_750_000,
    720: 1_250_000,
    540: 750_000,
    360: 400_000,
  },
  vp8: {
    1080: 2_000_000,
    720: 1_000_000,
    540: 600_000,
    360: 350_000,
  },
  vp9: {
    1080: 1_250_000,
    720: 900_000,
    540: 450_000,
    360: 275_000,
  },
  av1: {
    1080: 1_000_000,
    720: 600_000,
    540: 350_000,
    360: 200_000,
  },
};

export const getPreferredBitrate = (
  codec: string,
  frameHeight: number,
): number | undefined => {
  const codecLookup = lookup[codec.toLowerCase()];
  if (!codecLookup) return;

  return codecLookup[frameHeight];
};
