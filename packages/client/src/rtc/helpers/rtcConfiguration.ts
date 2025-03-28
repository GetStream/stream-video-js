import { ICEServer } from '../../gen/coordinator';

export const toRtcConfiguration = (config: ICEServer[]): RTCConfiguration => {
  return {
    bundlePolicy: 'max-bundle',
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
};
