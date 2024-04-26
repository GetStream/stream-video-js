import { LocalClientDetailsType } from '../client-details';
import { SdkType } from '../gen/video/sfu/models/models';

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
  const sdkName =
    sdk && sdk.type === SdkType.REACT
      ? 'stream-react'
      : sdk && sdk.type === SdkType.REACT_NATIVE
      ? 'stream-react-native'
      : 'stream-js';

  const sdkVersion = sdk
    ? `${sdk.major}.${sdk.minor}.${sdk.patch}`
    : '0.0.0-development';

  return {
    sdkName,
    sdkVersion,
    ...platform,
  };
};
