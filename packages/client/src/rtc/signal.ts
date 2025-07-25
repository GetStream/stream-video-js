import { SfuEvent } from '../gen/video/sfu/event/events';
import { getLogger } from '../logger';
import { DispatchableMessage, SfuEventKinds } from './Dispatcher';

export const createWebSocketSignalChannel = (opts: {
  endpoint: string;
  onMessage: <K extends SfuEventKinds>(message: DispatchableMessage<K>) => void;
  tag: string;
}) => {
  const { endpoint, onMessage, tag } = opts;
  const logger = getLogger(['SfuClientWS', tag]);
  logger('debug', 'Creating signaling WS channel:', endpoint);
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

  ws.addEventListener('message', (e) => {
    try {
      const message =
        e.data instanceof ArrayBuffer
          ? SfuEvent.fromBinary(new Uint8Array(e.data))
          : SfuEvent.fromJsonString(e.data.toString());

      onMessage(message as DispatchableMessage<SfuEventKinds>);
    } catch (err) {
      logger(
        'error',
        'Failed to decode a message. Check whether the Proto models match.',
        { event: e, error: err },
      );
    }
  });
  return ws;
};
