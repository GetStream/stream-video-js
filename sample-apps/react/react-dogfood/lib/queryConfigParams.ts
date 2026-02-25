import { NextRouter } from 'next/router';
import { Call, PreferredCodec } from '@stream-io/video-react-sdk';

export const getQueryConfigParams = (query: NextRouter['query']) => {
  return {
    videoFile: query['video_file'] as string | undefined,
    videoFileLeaveCallOnEnd: query['video_file_end_call'] === 'true',
    videoCodecOverride: (query['video_encoder'] || query['video_codec']) as
      | PreferredCodec
      | undefined,
    fmtpOverride: query['fmtp'] as string | undefined,
    bitrateOverride: query['bitrate'] as string | undefined,
    videoDecoderOverride: query['video_decoder'] as PreferredCodec | undefined,
    videoDecoderFmtpOverride: query['video_decoder_fmtp'] as string | undefined,
    maxSimulcastLayers: query['max_simulcast_layers'] as string | undefined,
    forceCodec: query['force_codec'] as PreferredCodec | undefined,
    cameraOverride: query['camera'] as string | undefined,
    microphoneOverride: query['mic'] as string | undefined,
  };
};

export const applyQueryConfigParams = (
  call: Call,
  query: NextRouter['query'],
) => {
  const config = getQueryConfigParams(query);
  const {
    videoDecoderFmtpOverride,
    videoCodecOverride,
    fmtpOverride,
    videoDecoderOverride,
    bitrateOverride,
    forceCodec,
    maxSimulcastLayers,
    cameraOverride,
    microphoneOverride,
  } = config;

  if (cameraOverride != null) {
    if (cameraOverride === 'false') {
      call.camera
        .disable()
        .catch((e) => console.error('Failed to disable camera', e));
    } else {
      call.camera
        .enable()
        .catch((e) => console.error('Failed to enable camera', e));
    }
  }

  if (microphoneOverride != null) {
    if (microphoneOverride === 'false') {
      call.microphone
        .disable()
        .catch((e) => console.error('Failed to disable microphone', e));
    } else {
      call.microphone
        .enable()
        .catch((e) => console.error('Failed to enable microphone', e));
    }
  }

  const preferredBitrate = bitrateOverride
    ? parseInt(bitrateOverride, 10)
    : undefined;

  call.updatePublishOptions({
    dangerouslyForceCodec: forceCodec,
    preferredCodec: videoCodecOverride,
    fmtpLine: fmtpOverride,
    preferredBitrate,
    subscriberCodec: videoDecoderOverride,
    subscriberFmtpLine: videoDecoderFmtpOverride,
    maxSimulcastLayers: maxSimulcastLayers
      ? parseInt(maxSimulcastLayers, 10)
      : undefined,
  });

  return config;
};
