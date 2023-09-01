import {
  setSdkInfo,
  setDeviceInfo,
  setOSInfo,
  SfuModels,
} from '@stream-io/video-client';
import { Platform } from 'react-native';
import { version } from '../../version';
import RNDeviceInfo from 'react-native-device-info';

const [major, minor, patch] = version.split('.');

export const setClientDetails = () => {
  setSdkInfo({
    type: SfuModels.SdkType.REACT_NATIVE,
    major,
    minor,
    patch,
  });

  const deviceInfo = RNDeviceInfo;

  setOSInfo({
    name: Platform.OS,
    version: deviceInfo.getSystemVersion(),
    architecture: deviceInfo.supportedAbisSync().join(','),
  });

  setDeviceInfo({
    // Apple iPhone SE Handset, Google sdk_gphone64_x86_64 Handset
    name: `${deviceInfo.getManufacturerSync()} ${
      deviceInfo.getModel() ?? deviceInfo.getDeviceId()
    } ${deviceInfo.getDeviceType()}`,
    version: '',
  });
};
