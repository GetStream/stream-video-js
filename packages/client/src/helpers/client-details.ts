import {
  AndroidThermalState,
  AppleThermalState,
  ClientDetails,
  Device,
  OS,
  Sdk,
  SdkType,
} from '../gen/video/sfu/models/models';
import { SendStatsRequest } from '../gen/video/sfu/signal_rpc/signal';
import { isReactNative } from './platforms';
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
let deviceState: SendStatsRequest['deviceState'] = { oneofKind: undefined };

export const setSdkInfo = (info: Sdk) => {
  sdkInfo = info;
};

export const getSdkInfo = () => {
  return sdkInfo;
};

export const setOSInfo = (info: OS) => {
  osInfo = info;
};

export const setDeviceInfo = (info: Device) => {
  deviceInfo = info;
};

export const getWebRTCInfo = () => {
  return webRtcInfo;
};

export const setWebRTCInfo = (info: WebRTCInfoType) => {
  webRtcInfo = info;
};

export const setThermalState = (state: string) => {
  if (!osInfo) {
    deviceState = { oneofKind: undefined };
    return;
  }

  if (osInfo.name === 'android') {
    const thermalState =
      AndroidThermalState[state as keyof typeof AndroidThermalState] ||
      AndroidThermalState.UNSPECIFIED;

    deviceState = {
      oneofKind: 'android',
      android: {
        thermalState,
        isPowerSaverMode:
          deviceState?.oneofKind === 'android' &&
          deviceState.android.isPowerSaverMode,
      },
    };
  }

  if (osInfo.name.toLowerCase() === 'ios') {
    const thermalState =
      AppleThermalState[state as keyof typeof AppleThermalState] ||
      AppleThermalState.UNSPECIFIED;

    deviceState = {
      oneofKind: 'apple',
      apple: {
        thermalState,
        isLowPowerModeEnabled:
          deviceState?.oneofKind === 'apple' &&
          deviceState.apple.isLowPowerModeEnabled,
      },
    };
  }
};

export const setPowerState = (powerMode: boolean) => {
  if (!osInfo) {
    deviceState = { oneofKind: undefined };
    return;
  }

  if (osInfo.name === 'android') {
    deviceState = {
      oneofKind: 'android',
      android: {
        thermalState:
          deviceState?.oneofKind === 'android'
            ? deviceState.android.thermalState
            : AndroidThermalState.UNSPECIFIED,
        isPowerSaverMode: powerMode,
      },
    };
  }

  if (osInfo.name.toLowerCase() === 'ios') {
    deviceState = {
      oneofKind: 'apple',
      apple: {
        thermalState:
          deviceState?.oneofKind === 'apple'
            ? deviceState.apple.thermalState
            : AppleThermalState.UNSPECIFIED,
        isLowPowerModeEnabled: powerMode,
      },
    };
  }
};

export const getDeviceState = () => {
  return deviceState;
};

export const getClientDetails = async (): Promise<ClientDetails> => {
  if (isReactNative()) {
    // Since RN doesn't support web, sharing browser info is not required
    return {
      sdk: sdkInfo,
      os: osInfo,
      device: deviceInfo,
    };
  }

  // @ts-expect-error - userAgentData is not yet in the TS types
  const userAgentDataApi = navigator.userAgentData;
  let userAgentData:
    | {
        platform?: string;
        platformVersion?: string;
        fullVersionList?: Array<{ brand: string; version: string }>;
      }
    | undefined;
  if (userAgentDataApi && userAgentDataApi.getHighEntropyValues) {
    try {
      userAgentData = await userAgentDataApi.getHighEntropyValues([
        'platform',
        'platformVersion',
        'fullVersionList',
      ]);
    } catch {
      // Ignore the error
    }
  }

  const userAgent = new UAParser(navigator.userAgent);
  const { browser, os, device, cpu } = userAgent.getResult();
  // If userAgentData is available, it means we are in a modern Chromium browser,
  // and we can use it to get more accurate browser information.
  // We hook into the fullVersionList to find the browser name and version and
  // eventually detect exotic browsers like Samsung Internet, AVG Secure Browser, etc.
  // who by default they identify themselves as "Chromium" in the user agent string.
  // Eliminates the generic "Chromium" name and "Not)A_Brand" name from the list.
  // https://wicg.github.io/ua-client-hints/#create-arbitrary-brands-section
  const uaBrowser = userAgentData?.fullVersionList?.find(
    (v) => !v.brand.includes('Chromium') && !v.brand.match(/[()\-./:;=?_]/g),
  );
  return {
    sdk: sdkInfo,
    browser: {
      name: uaBrowser?.brand || browser.name || navigator.userAgent,
      version: uaBrowser?.version || browser.version || '',
    },
    os: {
      name: userAgentData?.platform || os.name || '',
      version: userAgentData?.platformVersion || os.version || '',
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
