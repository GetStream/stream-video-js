export type ConfigProps =
  | {
      ringing?: boolean;
      enableNonRingingPushNotifications?: boolean;
      androidPictureInPicture?: boolean;
      androidKeepCallAlive?: boolean;
      enableScreenshare?: boolean;
      addNoiseCancellation?: boolean;
      appleTeamId?: string;
      iOSEnableMultitaskingCameraAccess?: boolean;
    }
  | undefined;
