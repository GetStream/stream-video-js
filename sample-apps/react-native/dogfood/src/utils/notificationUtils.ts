import notifee, { AndroidImportance } from '@notifee/react-native';

export const NON_RINGING_CHANNEL_ID = 'stream_non_ringing_calls';

export type NonRingingPushEvent =
  | 'call.live_started'
  | 'call.notification'
  | 'call.missed';

export const NON_RINGING_EVENTS = new Set<string>([
  'call.live_started',
  'call.notification',
  'call.missed',
]);

export function getNotificationText(
  type: NonRingingPushEvent,
  createdByName: string,
): { title: string; body: string } {
  switch (type) {
    case 'call.live_started':
      return {
        title: 'Livestream started',
        body: `${createdByName} started a livestream`,
      };
    case 'call.notification':
      return {
        title: 'Call notification',
        body: `${createdByName} is notifying you about a call`,
      };
    case 'call.missed':
      return {
        title: 'Missed call',
        body: `You missed a call from ${createdByName}`,
      };
  }
}

/**
 * Display a non-ringing notification via notifee.
 * Android-specific options (channel, icon) are ignored on iOS.
 */
export async function displayNonRingingNotification(
  streamData: Record<string, string>,
): Promise<void> {
  const type = streamData.type;
  if (!NON_RINGING_EVENTS.has(type)) {
    return;
  }

  const callCid = streamData.call_cid;
  const createdByName = streamData.created_by_display_name || 'Someone';
  const { title, body } = getNotificationText(
    type as NonRingingPushEvent,
    createdByName,
  );

  await notifee.displayNotification({
    title,
    body,
    data: {
      call_cid: callCid,
      type,
      sender: 'stream.video',
    },
    android: {
      channelId: NON_RINGING_CHANNEL_ID,
      importance: AndroidImportance.HIGH,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      smallIcon: 'ic_launcher',
    },
  });
}
