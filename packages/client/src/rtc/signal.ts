import { SfuEvent } from '../gen/video/sfu/event/events';
import { DispatchableMessage, SfuEventKinds } from './Dispatcher';
import { Tracer } from '../stats';
import { videoLoggerSystem } from '../logger';

export const createWebSocketSignalChannel = (opts: {
  endpoint: string;
  onMessage: <K extends SfuEventKinds>(message: DispatchableMessage<K>) => void;
  tag: string;
  tracer: Tracer | undefined;
}) => {
  const { endpoint, onMessage, tag, tracer } = opts;
  const logger = videoLoggerSystem.getLogger('SfuClientWS', { tags: [tag] });
  logger.debug('Creating signaling WS channel:', endpoint);
  const ws = new WebSocket(endpoint);
  ws.binaryType = 'arraybuffer'; // do we need this?

  ws.addEventListener('error', (e) => {
    logger.error('Signaling WS channel error', e);
    tracer?.trace('signal.ws.error', e);
  });

  ws.addEventListener('close', (e) => {
    logger.info('Signaling WS channel is closed', e);
    tracer?.trace('signal.ws.close', e);
  });

  ws.addEventListener('open', (e) => {
    logger.info('Signaling WS channel is open', e);
    tracer?.trace('signal.ws.open', e);
  });

  ws.addEventListener('message', (e) => {
    try {
      const message =
        e.data instanceof ArrayBuffer
          ? SfuEvent.fromBinary(new Uint8Array(e.data))
          : SfuEvent.fromJsonString(e.data.toString());

      onMessage(message as DispatchableMessage<SfuEventKinds>);
    } catch (err) {
      const message =
        'Failed to decode a message. Check whether the Proto models match.';
      logger.error(message, { event: e, error: err });
      tracer?.trace('signal.ws.message.error', message);
    }
  });
  return ws;
};
