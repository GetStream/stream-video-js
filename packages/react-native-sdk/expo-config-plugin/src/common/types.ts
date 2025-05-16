export type RingingPushNotifications = {
  disableVideoIos?: boolean;
  includesCallsInRecentsIos?: boolean;
  showWhenLockedAndroid?: boolean;
};

export type ConfigProps =
  | {
      ringingPushNotifications?: RingingPushNotifications;
      enableNonRingingPushNotifications?: boolean;
      androidPictureInPicture?: boolean;
      androidKeepCallAlive?: boolean;
      enableScreenshare?: boolean;
      addNoiseCancellation?: boolean;
      appleTeamId?: string;
      iOSEnableMultitaskingCameraAccess?: boolean;
    }
  | undefined;
