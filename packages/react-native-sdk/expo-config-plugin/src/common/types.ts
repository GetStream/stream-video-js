export type ConfigProps =
  | {
      ringing?: boolean;
      enableNonRingingPushNotifications?: boolean;
      androidPictureInPicture?: boolean;
      androidKeepCallAlive?: boolean;
      iosKeepCallAlive?: boolean;
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
      /**
       * Controls the Android FCM messaging-service override that resolves
       * `com.google.firebase.MESSAGING_EVENT` service collisions (e.g. with
       * `expo-notifications`).
       *
       * - **omitted** — if `expo-notifications` is installed, the plugin
       *   automatically overrides its service
       *   (`expo.modules.notifications.service.ExpoFirebaseMessagingService`);
       *   if it isn't installed, nothing is generated.
       * - **`null`** — opt out: no override even when `expo-notifications` is installed.
       * - **a fully-qualified class name** (package + class) — override that specific
       *   `FirebaseMessagingService`, e.g.
       *   `"io.invertase.firebase.messaging.ReactNativeFirebaseMessagingService"`.
       */
      androidMessagingServiceBaseClass?: string | null;
    }
  | undefined;
