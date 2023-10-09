import { Call } from '@stream-io/video-client';
import { NonRingingPushEvent } from '../StreamVideoRN/types';

export type NewCallNotificationCallback = (
  call: Call,
  notificationType: NonRingingPushEvent,
) => void;

type NewNotificationCallbacks = {
  current?: NewCallNotificationCallback[];
};

let lastCid = '';

const newNotificationCallbacks: NewNotificationCallbacks = {};

export const onNewCallNotification: NewCallNotificationCallback = (
  call,
  notificationType,
) => {
  if (newNotificationCallbacks.current && lastCid !== call.cid) {
    newNotificationCallbacks.current.forEach((callback) =>
      callback(call, notificationType),
    );
    lastCid = call.cid;
  }
};

export default newNotificationCallbacks;
