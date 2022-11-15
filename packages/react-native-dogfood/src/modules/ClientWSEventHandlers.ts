import {
  // CallAccepted,
  // CallCancelled,
  // CallCreated,
  // CallRejected,
  // Envelopes,
  StreamVideoClient,
} from '@stream-io/video-client';
// import { Call } from '@stream-io/video-client/dist/src/gen/video/coordinator/call_v1/call';

export const registerWSEventHandlers = (
  videoClient: StreamVideoClient,
  // answerCall: () => void,
  // displayIncomingCallNow?: (call: Call) => void,
  // hangupCall?: (call: Call, cancelled?: boolean) => void,
  // rejectCall?: (call: Call) => void,
) => {
  if (videoClient) {
    // watchCallAcceptedEvent(videoClient, answerCall);
    // watchCallCreatedEvent(videoClient, displayIncomingCallNow);
    // watchCallRejectedEvent(videoClient, rejectCall);
    // watchCallCancelledEvent(videoClient, hangupCall);
  }
};

// const watchCallCreatedEvent = (
//   videoClient: StreamVideoClient,
//   displayIncomingCallNow?: (call: Call) => void,
// ) => {
//   videoClient.on(
//     'callCreated',
//     (event: CallCreated, _envelopes?: Envelopes) => {
//       const { call } = event;
//       if (!call) {
//         console.warn("Can't find call in CallCreated event");
//         return;
//       } else {
//         if (displayIncomingCallNow) {
//           displayIncomingCallNow(call);
//         }
//       }
//     },
//   );
// };

// const watchCallRejectedEvent = (
//   videoClient: StreamVideoClient,
//   rejectCall?: (call: Call) => void,
// ) => {
//   videoClient.on(
//     'callRejected',
//     (event: CallRejected, _envelopes?: Envelopes) => {
//       const { call } = event;
//       if (!call) {
//         console.warn("Can't find call in CallCreated event");
//         return;
//       } else {
//         if (rejectCall) {
//           rejectCall(call);
//         }
//       }
//     },
//   );
// };

// const watchCallAcceptedEvent = (
//   videoClient: StreamVideoClient,
//   answerCall?: () => void,
// ) => {
//   videoClient.on(
//     'callAccepted',
//     (event: CallAccepted, _envelopes?: Envelopes) => {
//       const { call } = event;
//       if (!call) {
//         console.warn("Can't find call in CallCreated event");
//         return;
//       } else {
//         if (answerCall) {
//           answerCall();
//         }
//       }
//     },
//   );
// };

// const watchCallCancelledEvent = (
//   videoClient: StreamVideoClient,
//   hangupCall?: (call: Call) => void,
// ) => {
//   videoClient.on(
//     'callCancelled',
//     (event: CallCancelled, _envelopes?: Envelopes) => {
//       const { call } = event;
//       if (!call) {
//         console.warn("Can't find call in CallCreated event");
//         return;
//       } else {
//         if (hangupCall) {
//           hangupCall(call);
//         }
//       }
//     },
//   );
// };
