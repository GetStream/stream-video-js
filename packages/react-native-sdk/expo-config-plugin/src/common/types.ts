export type RingingPushNotifications = {
  disableVideoIos?: boolean;
  includesCallsInRecentsIos?: boolean;
};

export type AndroidPictureInPicture = {
  enableAutomaticEnter: boolean;
};

export type ConfigProps = {
  ringingPushNotifications?: RingingPushNotifications;
  enableNonRingingPushNotifications?: boolean;
  androidPictureInPicture?: AndroidPictureInPicture;
};
