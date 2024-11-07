import { PreferredCodec, PublishOptions } from '../types';
import { TargetResolutionResponse } from '../gen/shims';
import { isSvcCodec } from './codecs';
import { getOptimalBitrate } from './bitrateLookup';
import { VideoQuality } from '../gen/video/sfu/models/models';

export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;
  // NOTE OL: should be part of RTCRtpEncodingParameters
  scalabilityMode?: string;
};

const DEFAULT_BITRATE = 1250000;
const defaultTargetResolution: TargetResolutionResponse = {
  bitrate: DEFAULT_BITRATE,
  width: 1280,
  height: 720,
};

const defaultBitratePerRid: Record<string, number> = {
  q: 300000,
  h: 750000,
  f: DEFAULT_BITRATE,
};

/**
 * In SVC, we need to send only one video encoding (layer).
 * this layer will have the additional spatial and temporal layers
 * defined via the scalabilityMode property.
 *
 * @param layers the layers to process.
 */
export const toSvcEncodings = (layers: OptimalVideoLayer[] | undefined) => {
  // we take the `f` layer, and we rename it to `q`.
  return layers?.filter((l) => l.rid === 'f').map((l) => ({ ...l, rid: 'q' }));
};

/**
 * Converts the rid to a video quality.
 */
export const ridToVideoQuality = (rid: string): VideoQuality => {
  return rid === 'q'
    ? VideoQuality.LOW_UNSPECIFIED
    : rid === 'h'
      ? VideoQuality.MID
      : VideoQuality.HIGH; // default to HIGH
};

/**
 * Determines the most optimal video layers for simulcasting
 * for the given track.
 *
 * @param videoTrack the video track to find optimal layers for.
 * @param targetResolution the expected target resolution.
 * @param codecInUse the codec in use.
 * @param publishOptions the publish options for the track.
 */
export const findOptimalVideoLayers = (
  videoTrack: MediaStreamTrack,
  targetResolution: TargetResolutionResponse = defaultTargetResolution,
  codecInUse?: PreferredCodec,
  publishOptions?: PublishOptions,
) => {
  const optimalVideoLayers: OptimalVideoLayer[] = [];
  const settings = videoTrack.getSettings();
  const { width = 0, height = 0 } = settings;
  const {
    scalabilityMode,
    bitrateDownscaleFactor = 2,
    maxSimulcastLayers = 3,
  } = publishOptions || {};
  const maxBitrate = getComputedMaxBitrate(
    targetResolution,
    width,
    height,
    codecInUse,
    publishOptions,
  );
  let downscaleFactor = 1;
  let bitrateFactor = 1;
  const svcCodec = isSvcCodec(codecInUse);
  const totalLayers = svcCodec ? 3 : Math.min(3, maxSimulcastLayers);
  for (const rid of ['f', 'h', 'q'].slice(0, totalLayers)) {
    const layer: OptimalVideoLayer = {
      active: true,
      rid,
      width: Math.round(width / downscaleFactor),
      height: Math.round(height / downscaleFactor),
      maxBitrate:
        Math.round(maxBitrate / bitrateFactor) || defaultBitratePerRid[rid],
      maxFramerate: 30,
    };
    if (svcCodec) {
      // for SVC codecs, we need to set the scalability mode, and the
      // codec will handle the rest (layers, temporal layers, etc.)
      layer.scalabilityMode = scalabilityMode || 'L3T2_KEY';
    } else {
      // for non-SVC codecs, we need to downscale proportionally (simulcast)
      layer.scaleResolutionDownBy = downscaleFactor;
    }

    downscaleFactor *= 2;
    bitrateFactor *= bitrateDownscaleFactor;

    // Reversing the order [f, h, q] to [q, h, f] as Chrome uses encoding index
    // when deciding which layer to disable when CPU or bandwidth is constrained.
    // Encodings should be ordered in increasing spatial resolution order.
    optimalVideoLayers.unshift(layer);
  }

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
 * @param codecInUse the codec in use.
 * @param publishOptions the publish options.
 */
export const getComputedMaxBitrate = (
  targetResolution: TargetResolutionResponse,
  currentWidth: number,
  currentHeight: number,
  codecInUse?: PreferredCodec,
  publishOptions?: PublishOptions,
): number => {
  // if the current resolution is lower than the target resolution,
  // we want to proportionally reduce the target bitrate
  const {
    width: targetWidth,
    height: targetHeight,
    bitrate: targetBitrate,
  } = targetResolution;
  const { preferredBitrate } = publishOptions || {};
  const frameHeight =
    currentWidth > currentHeight ? currentHeight : currentWidth;
  const bitrate =
    preferredBitrate ||
    (codecInUse ? getOptimalBitrate(codecInUse, frameHeight) : targetBitrate);
  if (currentWidth < targetWidth || currentHeight < targetHeight) {
    const currentPixels = currentWidth * currentHeight;
    const targetPixels = targetWidth * targetHeight;
    const reductionFactor = currentPixels / targetPixels;
    return Math.round(bitrate * reductionFactor);
  }
  return bitrate;
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
  publishOptions?: PublishOptions,
  defaultMaxBitrate = 3000000,
): OptimalVideoLayer[] => {
  const { screenShareSettings: preferences } = publishOptions || {};
  const settings = videoTrack.getSettings();
  return [
    {
      active: true,
      rid: 'q', // single track, start from 'q'
      width: settings.width || 0,
      height: settings.height || 0,
      scaleResolutionDownBy: 1,
      maxBitrate: preferences?.maxBitrate ?? defaultMaxBitrate,
      maxFramerate: preferences?.maxFramerate ?? 30,
    },
  ];
};
