const lookup: Record<string, Record<number, number> | undefined> = {
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
};

export const getPreferredBitrate = (
  codec: string,
  frameHeight: number,
): number | undefined => {
  const codecLookup = lookup[codec.toLowerCase()];
  if (!codecLookup) return;

  return codecLookup[frameHeight];
};
