export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;
};

export const findOptimalVideoLayers = async (mediaStream: MediaStream) => {
  const steps: [number, number, number][] = [
    // [4096, 2160], // 4K
    // [1920, 1080, 3_072_000], // Full-HD
    [1280, 720, 1000000],
    [960, 540, 850000],
    [640, 480, 500000],
    [320, 240, 250000],
    [160, 120, 125000],
  ];

  const optimalVideoLayers: OptimalVideoLayer[] = [];
  for (let step = 0; step < steps.length; step++) {
    const [w, h, maxBitrate] = steps[step];
    const [videoTrack] = mediaStream.getVideoTracks();
    const settings = videoTrack.getSettings();

    // found ideal layer
    if (w === settings.width && h === settings.height) {
      let scaleFactor: number = 1;
      ['f', 'h', 'q'].forEach((rid, i) => {
        optimalVideoLayers.push({
          rid,
          width: w / scaleFactor,
          height: h / scaleFactor,
          maxBitrate: maxBitrate / scaleFactor,
          scaleResolutionDownBy: scaleFactor,
        });
        scaleFactor *= 2;
      });

      break;
    }
  }
  return optimalVideoLayers;
};

export const defaultVideoLayers: OptimalVideoLayer[] = [
  {
    rid: 'f',
    maxBitrate: 500000,
    width: 640,
    height: 480,
  },
  {
    rid: 'h',
    maxBitrate: 250000,
    width: 320,
    height: 240,
    scaleResolutionDownBy: 2.0,
  },
  {
    rid: 'q',
    maxBitrate: 125000,
    width: 160,
    height: 120,
    scaleResolutionDownBy: 4.0,
  },
];
