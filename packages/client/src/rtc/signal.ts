import WebSocket from 'isomorphic-ws';
import { SfuEvent } from '../gen/video/sfu/event/events';
import { getLogger } from '../logger';

export const createWebSocketSignalChannel = (opts: {
  endpoint: string;
  onMessage?: (message: SfuEvent) => void;
}) => {
  const logger = getLogger(['sfu-client']);
  const { endpoint, onMessage } = opts;
  const ws = new WebSocket(endpoint);
  ws.binaryType = 'arraybuffer'; // do we need this?

  ws.addEventListener('error', (e) => {
    logger('error', 'Signaling WS channel error', e);
  });

  ws.addEventListener('close', (e) => {
    logger('info', 'Signaling WS channel is closed', e);
  });

  ws.addEventListener('open', (e) => {
    logger('info', 'Signaling WS channel is open', e);
  });

  if (onMessage) {
    ws.addEventListener('message', (e) => {
      try {
        const message =
          e.data instanceof ArrayBuffer
            ? SfuEvent.fromBinary(new Uint8Array(e.data))
            : SfuEvent.fromJsonString(e.data.toString());

        onMessage(message);
      } catch (err) {
        logger(
          'error',
          'Failed to decode a message. Check whether the Proto models match.',
          { event: e, error: err },
        );
      }
    });
  }
  return ws;
};
