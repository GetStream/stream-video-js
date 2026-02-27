export const isVoipEvent = (eventName: string) => {
  return (
    eventName === 'voipNotificationsRegistered' ||
    eventName === 'voipNotificationReceived'
  );
};

// @ts-expect-error - RN$Bridgeless is not properly typed
export const isTurboModuleEnabled = global.RN$Bridgeless === true;
