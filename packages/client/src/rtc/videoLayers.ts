export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;

  // defined here until we have this prop included in TypeScript
  // https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/1380
  maxFramerate?: number;
};

export const findOptimalVideoLayers = (videoTrack: MediaStreamTrack) => {
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
  const settings = videoTrack.getSettings();
  for (let step = 0; step < steps.length; step++) {
    const [w, h, maxBitrate] = steps[step];
    // found ideal layer
    if (w === settings.width && h === settings.height) {
      let scaleFactor: number = 1;
      ['f', 'h', 'q'].forEach((rid) => {
        optimalVideoLayers.push({
          active: true,
          rid,
          width: w / scaleFactor,
          height: h / scaleFactor,
          maxBitrate: maxBitrate / scaleFactor,
          scaleResolutionDownBy: scaleFactor,
          maxFramerate: {
            f: 30,
            h: 25,
            q: 20,
          }[rid],
        });
        scaleFactor *= 2;
      });

      break;
    }
  }
  return optimalVideoLayers;
};
