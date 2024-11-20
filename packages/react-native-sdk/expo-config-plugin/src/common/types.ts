export type RingingPushNotifications = {
  disableVideoIos?: boolean;
  includesCallsInRecentsIos?: boolean;
  showWhenLockedAndroid?: boolean;
};

export type AndroidPictureInPicture = {
  enableAutomaticEnter: boolean;
};

export type ConfigProps =
  | {
      ringingPushNotifications?: RingingPushNotifications;
      enableNonRingingPushNotifications?: boolean;
      androidPictureInPicture?: AndroidPictureInPicture;
      androidKeepCallAlive?: boolean;
      enableScreenshare?: boolean;
      appleTeamId?: string;
    }
  | undefined;
