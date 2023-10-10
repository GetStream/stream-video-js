import { getOSInfo } from '../client-details';
import { ScreenShareSettings } from '../types';
import { TargetResolution } from '../gen/coordinator';
import { isReactNative } from '../helpers/platforms';

export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;
};

const DEFAULT_BITRATE = 1250000;
const defaultTargetResolution: TargetResolution = {
  bitrate: DEFAULT_BITRATE,
  width: 1280,
  height: 720,
};

/**
 * Determines the most optimal video layers for simulcasting
 * for the given track.
 *
 * @param videoTrack the video track to find optimal layers for.
 * @param targetResolution the expected target resolution.
 */
export const findOptimalVideoLayers = (
  videoTrack: MediaStreamTrack,
  targetResolution: TargetResolution = defaultTargetResolution,
) => {
  const optimalVideoLayers: OptimalVideoLayer[] = [];
  const settings = videoTrack.getSettings();
  const { width: w = 0, height: h = 0 } = settings;

  const isRNIos = isReactNative() && getOSInfo()?.name.toLowerCase() === 'ios';

  const maxBitrate = getComputedMaxBitrate(targetResolution, w, h);
  let downscaleFactor = 1;
  ['f', 'h', 'q'].forEach((rid) => {
    // Reversing the order [f, h, q] to [q, h, f] as Chrome uses encoding index
    // when deciding which layer to disable when CPU or bandwidth is constrained.
    // Encodings should be ordered in increasing spatial resolution order.
    optimalVideoLayers.unshift({
      active: true,
      rid,
      width: Math.round(w / downscaleFactor),
      height: Math.round(h / downscaleFactor),
      maxBitrate: Math.round(maxBitrate / downscaleFactor),
      scaleResolutionDownBy: downscaleFactor,
      // Simulcast on iOS React-Native requires all encodings to share the same framerate
      maxFramerate: {
        f: 30,
        h: isRNIos ? 30 : 25,
        q: isRNIos ? 30 : 20,
      }[rid],
    });
    downscaleFactor *= 2;
  });

  // for simplicity, we start with all layers enabled, then this function
  // will clear/reassign the layers that are not needed
  return withSimulcastConstraints(settings, optimalVideoLayers);
};

/**
 * Computes the maximum bitrate for a given resolution.
 * If the current resolution is lower than the target resolution,
 * we want to proportionally reduce the target bitrate.
 * If the current resolution is higher than the target resolution,
 * we want to use the target bitrate.
 *
 * @param targetResolution the target resolution.
 * @param currentWidth the current width of the track.
 * @param currentHeight the current height of the track.
 */
export const getComputedMaxBitrate = (
  targetResolution: TargetResolution,
  currentWidth: number,
  currentHeight: number,
): number => {
  // if the current resolution is lower than the target resolution,
  // we want to proportionally reduce the target bitrate
  const { width: targetWidth, height: targetHeight } = targetResolution;
  if (currentWidth < targetWidth || currentHeight < targetHeight) {
    const currentPixels = currentWidth * currentHeight;
    const targetPixels = targetWidth * targetHeight;
    const reductionFactor = currentPixels / targetPixels;
    return Math.round(targetResolution.bitrate * reductionFactor);
  }
  return targetResolution.bitrate;
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
  preferences?: ScreenShareSettings,
): OptimalVideoLayer[] => {
  const settings = videoTrack.getSettings();
  return [
    {
      active: true,
      rid: 'q', // single track, start from 'q'
      width: settings.width || 0,
      height: settings.height || 0,
      scaleResolutionDownBy: 1,
      maxBitrate: preferences?.maxBitrate ?? 3000000,
      maxFramerate: preferences?.maxFramerate ?? 30,
    },
  ];
};
