import { ICEServer } from '../../gen/coordinator';

export const toRtcConfiguration = (
  config?: ICEServer[],
): RTCConfiguration | undefined => {
  if (!config || config.length === 0) return undefined;
  return {
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
};
