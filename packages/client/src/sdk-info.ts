import { UAParser } from 'ua-parser-js';
import { ClientDetails, Sdk } from './gen/video/sfu/models/models';
import { isReactNative } from './helpers/platforms';

let sdkInfo: Sdk | undefined;

export const setSdkInfo = (info: Sdk) => {
  sdkInfo = info;
};

export const getSdkInfo = () => {
  return sdkInfo;
};

export const getClientDetails = () => {
  const clientDetails: ClientDetails = {};
  if (isReactNative()) {
    // TODO RN
  } else {
    const details = new UAParser(navigator.userAgent).getResult();
    clientDetails.browser = {
      name: details.browser.name || navigator.userAgent,
      version: details.browser.version || '',
    };
    clientDetails.os = {
      name: details.os.name || '',
      version: details.os.version || '',
      architecture: details.cpu.architecture || '',
    };
    clientDetails.device = {
      name: `${details.device.vendor || ''} ${details.device.model || ''} ${
        details.device.type || ''
      }`,
      version: '',
    };
  }
  clientDetails.sdk = getSdkInfo();
  return clientDetails;
};
