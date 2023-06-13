import { StreamVideoRN } from '../StreamVideoRN';

export const getPushConfig = () => {
  const pushConfig = StreamVideoRN.getConfig().push;
  return pushConfig;
};
