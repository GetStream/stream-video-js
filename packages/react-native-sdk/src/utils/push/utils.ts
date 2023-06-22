import { StreamVideoClient } from '@stream-io/video-client';
import type { StreamVideoConfig } from '../StreamVideoRN/types';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

/* Call has been declined from the notification or callkeep and app does not have JS context setup yet, so we need to do two steps:
  1. we need to create a new client and connect the user to decline the call
  2. this is because the app is in background state and we don't have a client to decline the call
*/
export const declineCallFromPushInBackground = async (
  pushConfig: PushConfig,
  call_cid: string,
) => {
  let videoClient: StreamVideoClient | undefined;

  try {
    videoClient = await pushConfig.createStreamVideoClient();
    if (!videoClient) {
      return;
    }
    await videoClient.connectUser();
  } catch (e) {
    console.log('failed to create video client and connect user', e);
    return;
  }
  await processCallFromPush(videoClient, call_cid, 'decline');
};

/**
 * This function is used process the call from push notifications due to incoming call
 * It does the following steps:
 * 1. Get the call from the client if present or create a new call
 * 2. Fetch the latest state of the call from the server if its not already in ringing state
 * 3. Join or leave the call based on the user's action.
 */
export const processCallFromPush = async (
  client: StreamVideoClient,
  call_cid: string,
  action: 'accept' | 'decline',
) => {
  // if the we find the call and is already ringing, we don't need create a new call
  // as client would have received the call.ring state because the app had WS alive when receiving push notifications
  let callFromPush = client.readOnlyStateStore.calls.find(
    (call) => call.cid === call_cid && call.ringing,
  );
  if (!callFromPush) {
    // if not it means that WS is not alive when receiving the push notifications and we need to fetch the call
    const [callType, callId] = call_cid.split(':');
    callFromPush = client.call(callType, callId, true);
    await callFromPush.get();
  }
  try {
    if (action === 'accept') {
      await callFromPush.join();
    } else {
      await callFromPush.leave({ reject: true });
    }
  } catch (e) {
    console.log('failed to process call from push notification', e, action);
  }
};
