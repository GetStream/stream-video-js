import {
  setSdkInfo,
  setDeviceInfo,
  setOSInfo,
  SfuModels,
} from '@stream-io/video-client';
import { getRNDeviceInfoLib } from './device-info/libs';
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

  setOSInfo({
    name: Platform.OS,
    version: RNDeviceInfo.getSystemVersion(),
    architecture: RNDeviceInfo.supportedAbisSync().join(','),
  });

  setDeviceInfo({
    // Apple iPhone SE Handset, Google sdk_gphone64_x86_64 Handset
    name: `${RNDeviceInfo.getManufacturerSync()} ${
      RNDeviceInfo.getModel() ?? RNDeviceInfo.getDeviceId()
    } ${RNDeviceInfo.getDeviceType()}`,
    version: '',
  });
};
