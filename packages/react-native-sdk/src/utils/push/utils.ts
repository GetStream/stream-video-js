import type { NonRingingPushEvent } from '../StreamVideoRN/types';

export type StreamPushPayload =
  | {
      call_cid: string;
      type: 'call.ring' | NonRingingPushEvent;
      sender: string;
    }
  | undefined;

export type FirebaseRemoteMessage = {
  data?: Record<string, string | object> | undefined;
};

export function isFirebaseStreamVideoMessage(message: FirebaseRemoteMessage) {
  return message.data?.sender === 'stream.video';
}
