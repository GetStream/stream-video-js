import {
  CallCreated,
  Envelopes,
  StreamVideoClient,
} from '@stream-io/video-client';
import { Call } from '@stream-io/video-client/dist/src/gen/video/coordinator/call_v1/call';

export const registerWSEventHandlers = (
  videoClient: StreamVideoClient,
  displayIncomingCallNow: (call: Call) => void,
) => {
  if (videoClient) {
    watchCallCreatedEvents(videoClient, displayIncomingCallNow);
  }
};

const watchCallCreatedEvents = (
  videoClient: StreamVideoClient,
  displayIncomingCallNow: (call: Call) => void,
) => {
  videoClient.on(
    'callCreated',
    (event: CallCreated, _envelopes?: Envelopes) => {
      const { call } = event;
      if (!call) {
        console.warn("Can't find call in CallCreated event");
        return;
      } else {
        displayIncomingCallNow(call);
      }
    },
  );
};

export { watchCallCreatedEvents };
