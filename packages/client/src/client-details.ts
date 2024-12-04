import {
  AndroidState,
  AndroidThermalState,
  AppleState,
  AppleThermalState,
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

type DeviceState =
  | {
      oneofKind: 'android';
      android: AndroidState;
    }
  | {
      oneofKind: 'apple';
      apple: AppleState;
    }
  | {
      oneofKind: undefined;
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
let deviceState: DeviceState;

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

const getAndroidThermalState = (state: string) => {
  switch (state) {
    case 'UNKNOWN':
      return AndroidThermalState.UNSPECIFIED;
    case 'NONE':
      return AndroidThermalState.NONE;
    case 'LIGHT':
      return AndroidThermalState.LIGHT;
    case 'MODERATE':
      return AndroidThermalState.MODERATE;
    case 'SEVERE':
      return AndroidThermalState.SEVERE;
    case 'CRITICAL':
      return AndroidThermalState.CRITICAL;
    case 'EMERGENCY':
      return AndroidThermalState.EMERGENCY;
    case 'SHUTDOWN':
      return AndroidThermalState.SHUTDOWN;
    default:
      return AndroidThermalState.UNSPECIFIED;
  }
};

const getAppleThermalState = (state: string) => {
  switch (state.toString()) {
    case '0':
      return AppleThermalState.UNSPECIFIED;
    case '1':
      return AppleThermalState.NOMINAL;
    case '2':
      return AppleThermalState.FAIR;
    case '3':
      return AppleThermalState.SERIOUS;
    case '4':
      return AppleThermalState.CRITICAL;
    default:
      return AppleThermalState.UNSPECIFIED;
  }
};

export const setDeviceState = (state: {
  os: string;
  thermal: string;
  isLowPowerMode: boolean;
}) => {
  if (state.os === 'android') {
    deviceState = {
      oneofKind: 'android',
      android: {
        thermalState: getAndroidThermalState(state.thermal),
        isPowerSaverMode: state.isLowPowerMode,
      },
    };
  } else if (state.os === 'ios') {
    deviceState = {
      oneofKind: 'apple',
      apple: {
        thermalState: getAppleThermalState(state.thermal),
        isLowPowerModeEnabled: state.isLowPowerMode,
      },
    };
  } else {
    deviceState = { oneofKind: undefined };
  }
};

export const getDeviceState = () => {
  return deviceState;
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
