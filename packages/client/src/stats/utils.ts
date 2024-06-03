import { LocalClientDetailsType } from '../client-details';
import { Sdk, SdkType } from '../gen/video/sfu/models/models';

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

export const getSdkSignature = (clientDetails: LocalClientDetailsType) => {
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
