import {
  ClientDetails,
  Device,
  OS,
  Sdk,
  SdkType,
} from './gen/video/sfu/models/models';
import { isReactNative } from './helpers/platforms';
import { UAParser } from 'ua-parser-js';

type WebRTCInfoType = {
  version: string;
};

const version = process.env.PKG_VERSION || '0.0.0';
const [major, minor, patch] = version.split('.');

let sdkInfo: Sdk | undefined = {
  type: SdkType.PLAIN_JAVASCRIPT,
  major,
  minor,
  patch,
};

let osInfo: OS | undefined;
let deviceInfo: Device | undefined;
let webRtcInfo: WebRTCInfoType | undefined;

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

export const getWebRTCInfo = () => {
  return webRtcInfo;
};

export const setWebRTCInfo = (info: WebRTCInfoType) => {
  webRtcInfo = info;
};

export type LocalClientDetailsType = ClientDetails & {
  webRTCInfo?: WebRTCInfoType;
};

export const getClientDetails = (): LocalClientDetailsType => {
  if (isReactNative()) {
    // Since RN doesn't support web, sharing browser info is not required
    return {
      sdk: getSdkInfo(),
      os: getOSInfo(),
      device: getDeviceInfo(),
    };
  }

  const userAgent = new UAParser(navigator.userAgent);
  const { browser, os, device, cpu } = userAgent.getResult();
  return {
    sdk: getSdkInfo(),
    browser: {
      name: browser.name || navigator.userAgent,
      version: browser.version || '',
    },
    os: {
      name: os.name || '',
      version: os.version || '',
      architecture: cpu.architecture || '',
    },
    device: {
      name: [device.vendor, device.model, device.type]
        .filter(Boolean)
        .join(' '),
      version: '',
    },
  };
};
