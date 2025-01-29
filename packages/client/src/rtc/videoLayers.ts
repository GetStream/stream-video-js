import { isSvcCodec } from './codecs';
import {
  PublishOption,
  VideoDimension,
  VideoLayer,
  VideoQuality,
} from '../gen/video/sfu/models/models';
import { isAudioTrackType } from './helpers/tracks';

export type OptimalVideoLayer = RTCRtpEncodingParameters & {
  width: number;
  height: number;
  // NOTE OL: should be part of RTCRtpEncodingParameters
  scalabilityMode?: string;
};

const defaultBitratePerRid: Record<string, number> = {
  q: 300000,
  h: 750000,
  f: 1250000,
};

/**
 * In SVC, we need to send only one video encoding (layer).
 * this layer will have the additional spatial and temporal layers
 * defined via the scalabilityMode property.
 *
 * @param layers the layers to process.
 */
export const toSvcEncodings = (
  layers: OptimalVideoLayer[] | undefined,
): RTCRtpEncodingParameters[] | undefined => {
  if (!layers) return;
  // we take the highest quality layer, and we assign it to `q` encoder.
  const withRid = (rid: string) => (l: OptimalVideoLayer) => l.rid === rid;
  const highestLayer =
    layers.find(withRid('f')) ||
    layers.find(withRid('h')) ||
    layers.find(withRid('q'));
  return [{ ...highestLayer, rid: 'q' }];
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
 * Converts the given video layers to SFU video layers.
 */
export const toVideoLayers = (
  layers: OptimalVideoLayer[] | undefined = [],
): VideoLayer[] => {
  return layers.map<VideoLayer>((layer) => ({
    rid: layer.rid || '',
    bitrate: layer.maxBitrate || 0,
    fps: layer.maxFramerate || 0,
    quality: ridToVideoQuality(layer.rid || ''),
    videoDimension: { width: layer.width, height: layer.height },
  }));
};

/**
 * Converts the spatial and temporal layers to a scalability mode.
 */
const toScalabilityMode = (spatialLayers: number, temporalLayers: number) =>
  `L${spatialLayers}T${temporalLayers}${spatialLayers > 1 ? '_KEY' : ''}`;

/**
 * Determines the most optimal video layers for the given track.
 *
 * @param videoTrack the video track to find optimal layers for.
 * @param publishOption the publish options for the track.
 */
export const computeVideoLayers = (
  videoTrack: MediaStreamTrack,
  publishOption: PublishOption,
): OptimalVideoLayer[] | undefined => {
  if (isAudioTrackType(publishOption.trackType)) return;
  const optimalVideoLayers: OptimalVideoLayer[] = [];
  const settings = videoTrack.getSettings();
  const { width = 0, height = 0 } = settings;
  const {
    bitrate,
    codec,
    fps,
    maxSpatialLayers = 3,
    maxTemporalLayers = 3,
    videoDimension = { width: 1280, height: 720 },
  } = publishOption;
  const maxBitrate = getComputedMaxBitrate(
    videoDimension,
    width,
    height,
    bitrate,
  );
  let downscaleFactor = 1;
  let bitrateFactor = 1;
  const svcCodec = isSvcCodec(codec?.name);
  for (const rid of ['f', 'h', 'q'].slice(0, maxSpatialLayers)) {
    const layer: OptimalVideoLayer = {
      active: true,
      rid,
      width: Math.round(width / downscaleFactor),
      height: Math.round(height / downscaleFactor),
      maxBitrate:
        Math.round(maxBitrate / bitrateFactor) || defaultBitratePerRid[rid],
      maxFramerate: fps,
    };
    if (svcCodec) {
      // for SVC codecs, we need to set the scalability mode, and the
      // codec will handle the rest (layers, temporal layers, etc.)
      layer.scalabilityMode = toScalabilityMode(
        maxSpatialLayers,
        maxTemporalLayers,
      );
    } else {
      // for non-SVC codecs, we need to downscale proportionally (simulcast)
      layer.scaleResolutionDownBy = downscaleFactor;
    }

    downscaleFactor *= 2;
    bitrateFactor *= 2;

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
 * @param bitrate the target bitrate.
 */
export const getComputedMaxBitrate = (
  targetResolution: VideoDimension,
  currentWidth: number,
  currentHeight: number,
  bitrate: number,
): number => {
  // if the current resolution is lower than the target resolution,
  // we want to proportionally reduce the target bitrate
  const { width: targetWidth, height: targetHeight } = targetResolution;
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
