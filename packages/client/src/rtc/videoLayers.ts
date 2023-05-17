export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;
};

export const findOptimalVideoLayers = (
  videoTrack: MediaStreamTrack,
  maxBitrate: number = 1250000,
) => {
  const optimalVideoLayers: OptimalVideoLayer[] = [];
  const settings = videoTrack.getSettings();
  const { width: w = 0, height: h = 0 } = settings;

  let downscaleFactor = 1;
  ['f', 'h', 'q'].forEach((rid) => {
    // Reversing the order [f, h, q] to [q, h, f] as Chrome uses encoding index
    // when deciding which layer to disable when CPU or bandwidth is constrained.
    // Encodings should be ordered in increasing spatial resolution order.
    optimalVideoLayers.unshift({
      active: true,
      rid,
      width: w / downscaleFactor,
      height: h / downscaleFactor,
      maxBitrate: maxBitrate / downscaleFactor,
      scaleResolutionDownBy: downscaleFactor,
      maxFramerate: {
        f: 30,
        h: 25,
        q: 20,
      }[rid],
    });
    downscaleFactor *= 2;
  });

  // for simplicity, we start with all layers enabled, then this function
  // will clear/reassign the layers that are not needed
  return withSimulcastConstraints(settings, optimalVideoLayers);
};

/**
 * Browsers have different simulcast constraints for different video resolutions.
 *
 * This function modifies the provided list of video layers according to the
 * current implementation of simulcast constraints in the Chromium based browsers.
 *
 * https://chromium.googlesource.com/external/webrtc/+/refs/heads/main/media/engine/simulcast.cc#90
 */
const withSimulcastConstraints = (
  settings: MediaTrackSettings,
  optimalVideoLayers: OptimalVideoLayer[],
) => {
  let layers: OptimalVideoLayer[];

  const size = Math.max(settings.width || 0, settings.height || 0);
  if (size <= 320) {
    // provide only one layer 320x240 (q), the one with the highest quality
    layers = optimalVideoLayers.filter((layer) => layer.rid === 'f');
  } else if (size <= 640) {
    // provide two layers, 160x120 (q) and 640x480 (h)
    layers = optimalVideoLayers.filter((layer) => layer.rid !== 'h');
  } else {
    // provide three layers for sizes > 640x480
    layers = optimalVideoLayers;
  }

  const ridMapping = ['q', 'h', 'f'];
  return layers.map<OptimalVideoLayer>((layer, index) => ({
    ...layer,
    rid: ridMapping[index], // reassign rid
  }));
};

export const findOptimalScreenSharingLayers = (
  videoTrack: MediaStreamTrack,
): OptimalVideoLayer[] => {
  const settings = videoTrack.getSettings();
  return [
    {
      active: true,
      rid: 'q', // single track, start from 'q'
      width: settings.width || 0,
      height: settings.height || 0,
      maxBitrate: 3000000,
      scaleResolutionDownBy: 1,
      maxFramerate: 30,
    },
  ];
};
