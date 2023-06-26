import { Device, OS, Sdk } from './gen/video/sfu/models/models';

let sdkInfo: Sdk | undefined;
let osInfo: OS | undefined;
let deviceInfo: Device | undefined;

export const setSdkInfo = (info: Sdk) => {
  sdkInfo = info;
};

export const getSdkInfo = () => {
  return sdkInfo;
};

export const setOSInfo = (info: OS) => {
  osInfo = info;
};

export const getOSInfo = () => {
  return osInfo;
};

export const setDeviceInfo = (info: Device) => {
  deviceInfo = info;
};

export const getDeviceInfo = () => {
  return deviceInfo;
};
