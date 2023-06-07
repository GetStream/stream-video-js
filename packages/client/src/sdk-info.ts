import { Sdk } from './gen/video/sfu/models/models';

let sdkInfo: Sdk | undefined;

export const setSdkInfo = (info: Sdk) => {
  sdkInfo = info;
};

export const getSdkInfo = () => {
  return sdkInfo;
};
