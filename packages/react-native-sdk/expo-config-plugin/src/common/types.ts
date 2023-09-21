export type RingingPushNotifications = {
  disableVideo?: boolean;
  includesCallsInRecents?: boolean;
};

export type ConfigProps = {
  ringingPushNotifications?: RingingPushNotifications;
  enableLivePushNotifications?: boolean;
  enableCallNotifyPushNotifications?: boolean;
};
