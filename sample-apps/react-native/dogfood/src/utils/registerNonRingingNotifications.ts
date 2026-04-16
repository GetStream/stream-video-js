import notifee, { EventType } from '@notifee/react-native';
import { deeplinkCallId$ } from '../hooks/useDeepLinkEffect';

/**
 * Register notifee event listeners for non-ringing notification taps.
 * When a user taps a non-ringing notification, extract the call_cid
 * and navigate to the call via deeplinkCallId$.
 *
 * Must be called at app startup (outside React lifecycle)
 * so that taps from killed state are captured.
 */
export function registerNonRingingNotificationHandler() {
  // Handle notification taps in foreground/background
  notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleNotificationTap(detail.notification?.data);
    }
  });

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS) {
      handleNotificationTap(detail.notification?.data);
    }
  });

  // Handle cold-start tap (app was killed, launched by tapping notification)
  notifee.getInitialNotification().then((initialNotification) => {
    if (initialNotification) {
      handleNotificationTap(initialNotification.notification.data);
    }
  });
}

function handleNotificationTap(data?: {
  [key: string]: string | number | object;
}) {
  if (!data || data.sender !== 'stream.video') {
    return;
  }

  const callCid = data.call_cid;
  if (!callCid || typeof callCid !== 'string') {
    return;
  }

  // Extract call ID from cid (format: "type:id")
  const callId = callCid.split(':')[1];
  if (callId) {
    deeplinkCallId$.next(callId);
  }
  console.log('callCid', callCid);
}
