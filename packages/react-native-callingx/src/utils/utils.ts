export const isVoipEvent = (eventName: string) => {
  return (
    eventName === 'voipNotificationsRegistered' ||
    eventName === 'voipNotificationReceived'
  );
};
