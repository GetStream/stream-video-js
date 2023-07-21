import { Call, StreamVideoClient } from '@stream-io/video-client';
import type { StreamVideoConfig } from '../StreamVideoRN/types';

type PushConfig = NonNullable<StreamVideoConfig['push']>;

/* An action for the notification or callkeep and app does not have JS context setup yet, so we need to do two steps:
  1. we need to create a new client and connect the user to decline the call
  2. this is because the app is in background state and we don't have a client to get the call and do an action
*/
export const processCallFromPushInBackground = async (
  pushConfig: PushConfig,
  call_cid: string,
  action: Parameters<typeof processCallFromPush>[2],
) => {
  let videoClient: StreamVideoClient | undefined;

  try {
    videoClient = await pushConfig.createStreamVideoClient();
    if (!videoClient) {
      return;
    }
  } catch (e) {
    console.log('failed to create video client and connect user', e);
    return;
  }
  await processCallFromPush(videoClient, call_cid, action);
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
  action: 'accept' | 'decline' | 'pressed',
) => {
  let callFromPush: Call;
  try {
    callFromPush = await client.onRingingCall(call_cid);
  } catch (e) {
    console.log('failed to fetch call from push notification', e);
    return;
  }
  // note: when action was pressed, we dont need to do anything as the only thing is to do is to get the call which adds it to the client
  try {
    if (action === 'accept') {
      await callFromPush.join();
    } else if (action === 'decline') {
      await callFromPush.leave({ reject: true });
    }
  } catch (e) {
    console.log('failed to process call from push notification', e, action);
  }
};
