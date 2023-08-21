import {
  setSdkInfo,
  setDeviceInfo,
  setOSInfo,
  SfuModels,
} from '@stream-io/video-client';
import { getExpoDeviceInfoLib, getRNDeviceInfoLib } from './device-info/libs';
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

  const RNDeviceInfo = getRNDeviceInfoLib();
  const expoDeviceInfo = getExpoDeviceInfoLib();

  setOSInfo({
    name: Platform.OS,
    version: RNDeviceInfo
      ? RNDeviceInfo.getSystemVersion()
      : expoDeviceInfo.osVersion!!,
    architecture: RNDeviceInfo
      ? RNDeviceInfo.supportedAbisSync().join(',')
      : expoDeviceInfo.supportedCpuArchitectures?.join(',')!!,
  });

  setDeviceInfo({
    // Apple iPhone SE Handset, Google sdk_gphone64_x86_64 Handset
    name: RNDeviceInfo
      ? `${RNDeviceInfo.getManufacturerSync()} ${
          RNDeviceInfo.getModel() ?? RNDeviceInfo.getDeviceId()
        } ${RNDeviceInfo.getDeviceType()}`
      : `${expoDeviceInfo.manufacturer} ${
          expoDeviceInfo.modelId ?? expoDeviceInfo.deviceName
        } ${expoDeviceInfo.deviceType}`,
    version: '',
  });
};
