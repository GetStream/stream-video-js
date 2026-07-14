import { ICEServerResponse } from '../../gen/coordinator';

export const toRtcConfiguration = (
  config: ICEServerResponse[],
): RTCConfiguration => {
  return {
    bundlePolicy: 'max-bundle',
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
};
