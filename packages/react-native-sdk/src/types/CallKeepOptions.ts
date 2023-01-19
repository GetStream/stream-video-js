// copied this snippet from IOptions in react-native-callkeep/index.d.ts:
export interface CallKeepOptions {
  ios: {
    appName: string;
    imageName?: string;
    supportsVideo?: boolean;
    maximumCallGroups?: string;
    maximumCallsPerCallGroup?: string;
    ringtoneSound?: string;
    includesCallsInRecents?: boolean;
  };
  android: {
    alertTitle: string;
    alertDescription: string;
    cancelButton: string;
    okButton: string;
    imageName?: string;
    additionalPermissions: string[];
    selfManaged?: boolean;
    foregroundService?: {
      channelId: string;
      channelName: string;
      notificationTitle: string;
      notificationIcon?: string;
    };
  };
}
