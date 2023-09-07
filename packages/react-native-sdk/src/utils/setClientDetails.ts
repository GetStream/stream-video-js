import {
  setSdkInfo,
  setDeviceInfo,
  setOSInfo,
  SfuModels,
} from '@stream-io/video-client';
import { Platform } from 'react-native';
import { version } from '../../version';

const [major, minor, patch] = version.split('.');

export const setClientDetails = () => {
  setSdkInfo({
    type: SfuModels.SdkType.REACT_NATIVE,
    major,
    minor,
    patch,
  });

  let osName: string = Platform.OS;
  if (Platform.OS === 'ios') {
    // example: "iOS" | "iPadOS"
    osName = Platform.constants.systemName;
  }

  let osVersion = '';
  if (Platform.OS === 'android') {
    // example: "33" - its more OS API level than consumer version
    osVersion = Platform.constants.Version.toString();
  } else if (Platform.OS === 'ios') {
    // example: "16.2"
    osVersion = Platform.constants.osVersion;
  }

  setOSInfo({
    name: osName,
    version: osVersion,
    architecture: '',
  });

  let deviceName = '';
  if (Platform.OS === 'android') {
    // Example: "Google Pixel 7"
    const prefix =
      Platform.constants.Manufacturer.toLowerCase() ===
      Platform.constants.Brand.toLowerCase()
        ? Platform.constants.Manufacturer
        : `${Platform.constants.Manufacturer} ${Platform.constants.Brand}`;
    deviceName = `${prefix} ${Platform.constants.Model}`;
  } else if (Platform.OS === 'ios') {
    // note: osName check is necessary because Platform.isPad is not reliable
    deviceName = Platform.isPad || osName === 'iPadOS' ? 'iPad' : 'iPhone';
  }

  setDeviceInfo({
    name: deviceName,
    version: '',
  });
};
