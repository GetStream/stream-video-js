import { SfuEvent } from '../gen/video/sfu/event/events';

export const createWebSocketSignalChannel = (opts: {
  endpoint: string;
  onMessage?: (message: SfuEvent) => void;
}) => {
  const { endpoint, onMessage } = opts;
  const ws = new WebSocket(endpoint);
  ws.binaryType = 'arraybuffer'; // do we need this?

  ws.addEventListener('error', (e) => {
    console.error('Error', e);
  });

  ws.addEventListener('close', (e) => {
    console.warn('Signalling channel is closed', e);
  });

  ws.addEventListener('open', (e) => {
    console.log('Signalling channel is open', e);
  });

  if (onMessage) {
    ws.addEventListener('message', (e) => {
      const message =
        e.data instanceof ArrayBuffer
          ? SfuEvent.fromBinary(new Uint8Array(e.data))
          : SfuEvent.fromJsonString(e.data);

      onMessage(message);
    });
  }
  return ws;
};
