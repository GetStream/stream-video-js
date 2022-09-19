export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;
};

export const findOptimalVideoLayers = async (mediaStream: MediaStream) => {
  const steps: [number, number, number][] = [
    // [4096, 2160], // 4K
    // [1920, 1080, 3_072_000], // Full-HD
    [1280, 720, 1_536_000], // HD
    [640, 480, 768_000], // VGA
    [320, 240, 384_000], // QVGA
    [160, 120, 128_000],
  ];

  const optimalVideoLayers: OptimalVideoLayer[] = [];
  for (let step = 0; step < steps.length; step++) {
    const [w, h] = steps[step];
    const [videoTrack] = mediaStream.getVideoTracks();
    const settings = videoTrack.getSettings();

    // found ideal layer
    if (w === settings.width && h === settings.height) {
      let scaleFactor: number = 1;
      ['f', 'h', 'q'].forEach((rid, i) => {
        const [width, height, bitrate] = steps[step + i];
        optimalVideoLayers.push({
          rid,
          width,
          height,
          maxBitrate: bitrate,
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
    maxBitrate: 1000000,
    width: 1280,
    height: 720,
  },
  {
    rid: 'h',
    maxBitrate: 500000,
    width: 640,
    height: 480,
  },
  {
    rid: 'q',
    maxBitrate: 300000,
    width: 480,
    height: 360,
  },
];
