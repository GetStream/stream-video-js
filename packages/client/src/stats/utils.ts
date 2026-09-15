import { ClientDetails, Sdk, SdkType } from '../gen/video/sfu/models/models';

/**
 * Flatten the stats report into an array of stats objects.
 *
 * @param report the report to flatten.
 */
export const flatten = (report: RTCStatsReport) => {
  const stats: RTCStats[] = [];
  report.forEach((s) => {
    stats.push(s);
  });
  return stats;
};

/**
 * Dump the provided MediaStream into a JSON object.
 */
export const dumpStream = (stream: MediaStream) => ({
  id: stream.id,
  tracks: stream.getTracks().map((track) => ({
    id: track.id,
    kind: track.kind,
    label: track.label,
    enabled: track.enabled,
    muted: track.muted,
    readyState: track.readyState,
  })),
});

export const getSdkSignature = (clientDetails: ClientDetails) => {
  const { sdk, ...platform } = clientDetails;
  const sdkName = getSdkName(sdk);
  const sdkVersion = getSdkVersion(sdk);

  return {
    sdkName,
    sdkVersion,
    ...platform,
  };
};

export const getSdkName = (sdk: Sdk | undefined) => {
  return sdk && sdk.type === SdkType.REACT
    ? 'stream-react'
    : sdk && sdk.type === SdkType.REACT_NATIVE
      ? 'stream-react-native'
      : 'stream-js';
};

export const getSdkVersion = (sdk: Sdk | undefined) => {
  return sdk ? `${sdk.major}.${sdk.minor}.${sdk.patch}` : '0.0.0-development';
};

/**
 * Returns the identifier the SFU receives in the `X-Stream-Client` header,
 * e.g. `stream-video-react-v1.43.1`. Matches the format the coordinator
 * already gets through the client's user agent.
 */
export const getStreamClientId = (sdk: Sdk | undefined) => {
  const sdkPlatforms: Partial<Record<SdkType, string>> = {
    [SdkType.REACT]: 'react',
    [SdkType.REACT_NATIVE]: 'react-native',
  };

  const platform = (sdk && sdkPlatforms[sdk.type]) || 'js';
  return `stream-video-${platform}-v${getSdkVersion(sdk)}`;
};
