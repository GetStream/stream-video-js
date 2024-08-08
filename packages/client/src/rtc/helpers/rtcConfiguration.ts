import { ICEServer } from '../../gen/coordinator';

export const toRtcConfiguration = (config: ICEServer[]): RTCConfiguration => {
  return {
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
};
