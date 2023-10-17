export type RingingPushNotifications = {
  disableVideoIos?: boolean;
  includesCallsInRecentsIos?: boolean;
};

export type ConfigProps =
  | {
      ringingPushNotifications?: RingingPushNotifications;
      enableNonRingingPushNotifications?: boolean;
    }
  | undefined;
