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
       * Path(s) to the sounds played by the `useRingtone` hook on iOS, relative to the
       * project root. Supported: .caf, .aiff, .m4a, .wav. The files are copied into the app
       * bundle; reference them by name from the hook.
       */
      iosCallSounds?: string | string[];
      /**
       * Path(s) to the sounds played by the `useRingtone` hook on Android, relative to
       * the project root. Supported: .mp3, .ogg, .wav, .m4a. The files are copied into
       * `res/raw` with normalized names; reference them by name from the hook.
       */
      androidCallSounds?: string | string[];
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
