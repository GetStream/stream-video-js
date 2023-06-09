import { SfuEvent } from '../gen/video/sfu/event/events';

export const createWebSocketSignalChannel = (opts: {
  endpoint: string;
  onMessage?: (message: SfuEvent) => void;
}) => {
  const { endpoint, onMessage } = opts;
  const ws = new WebSocket(endpoint);
  ws.binaryType = 'arraybuffer'; // do we need this?

  ws.addEventListener('error', (e) => {
    console.log('Signaling WS channel error', e);
  });

  ws.addEventListener('close', (e) => {
    console.log('Signaling WS channel is closed', e);
  });

  ws.addEventListener('open', (e) => {
    console.log('Signaling WS channel is open', e);
  });

  if (onMessage) {
    ws.addEventListener('message', (e) => {
      try {
        const message =
          e.data instanceof ArrayBuffer
            ? SfuEvent.fromBinary(new Uint8Array(e.data))
            : SfuEvent.fromJsonString(e.data);

        onMessage(message);
      } catch (err) {
        console.error(
          'Failed to decode a message. Check whether the Proto models match.',
          e.data,
          e,
          err,
        );
      }
    });
  }
  return ws;
};
