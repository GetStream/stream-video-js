import { StreamVideoRN } from '../StreamVideoRN';

export const getPushConfig = () => {
  const pushConfig = StreamVideoRN.getConfig().push;
  if (pushConfig === undefined) {
    throw Error(
      'No config for push notifications have been set in StreamVideoRN.config. So push notifications cannot be enabled for this app',
    );
  }
  return pushConfig;
};
