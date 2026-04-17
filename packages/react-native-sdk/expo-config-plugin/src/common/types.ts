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
      /** Path to a custom ringtone file for iOS CallKit (relative to project root). Supported: .caf, .aiff, .m4a, .wav */
      iosRingtone?: string;
      /** Path to a custom CallKit icon PNG file for iOS (relative to project root). Must be a template image (monochrome). */
      iosCallKitIcon?: string;
      /** Path to a custom ringtone file for Android incoming calls (relative to project root). Supported: .mp3, .ogg, .wav, .m4a */
      androidRingtone?: string;
    }
  | undefined;
