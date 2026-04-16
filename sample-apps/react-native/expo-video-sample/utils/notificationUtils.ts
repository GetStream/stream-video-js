import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

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
 * Create Android notification channel for non-ringing events.
 * No-op on iOS.
 */
export async function ensureNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(NON_RINGING_CHANNEL_ID, {
      name: 'Call Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      showBadge: true,
    });
  }
}

/**
 * Display a non-ringing notification via expo-notifications.
 */
export async function displayNonRingingNotification(
  streamData: Record<string, string>,
): Promise<void> {
  const type = streamData.type;
  if (!NON_RINGING_EVENTS.has(type)) {
    return;
  }

  const createdByName = streamData.created_by_display_name || 'Someone';
  const { title, body } = getNotificationText(
    type as NonRingingPushEvent,
    createdByName,
  );
  const callCid = streamData.call_cid;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: true,
      data: {
        call_cid: callCid,
        type,
        sender: 'stream.video',
      },
    },
    trigger: null, // immediate
  });
}
