export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;
};

export const findOptimalVideoLayers = async (mediaStream: MediaStream) => {
  const steps: [number, number, number][] = [
    // [4096, 2160], // 4K
    // [1920, 1080, 3_072_000], // Full-HD
    [1280, 720, 1280_000], // HD
    [640, 480, 768000], // VGA
    [320, 240, 384000], // QVGA
    [160, 120, 128000],
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
    maxBitrate: 1280000,
    width: 1280,
    height: 720,
  },
  {
    rid: 'h',
    maxBitrate: 768000,
    width: 640,
    height: 480,
    scaleResolutionDownBy: 2.0,
  },
  {
    rid: 'q',
    maxBitrate: 384000,
    width: 480,
    height: 360,
    scaleResolutionDownBy: 4.0,
  },
];
