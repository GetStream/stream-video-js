import {
  WebsocketAuthRequest,
  WebsocketClientEvent,
  WebsocketEvent,
} from '../gen/video/coordinator/client_v1_rpc/websocket';

export type SocketOpts = {
  onOpen: WebSocket['onopen'];
  onClose: WebSocket['onclose'];
  onError: WebSocket['onerror'];
  onMessage: (message: WebsocketEvent) => void;
};

export const createCoordinatorWebSocket = (
  endpoint: string,
  authRequest: WebsocketAuthRequest,
  opts: SocketOpts,
) => {
  const { onOpen, onClose, onError, onMessage } = opts;
  return new Promise<WebSocket>((resolve, reject) => {
    let hasHealthcheckReceived = false;
    const authenticate = () => {
      // send the auth payload
      ws.send(
        WebsocketClientEvent.toBinary({
          event: {
            oneofKind: 'authRequest',
            authRequest,
          },
        }),
      );

      const giveUpAfterMs = 5000;
      const frequency = 250;
      let attempts = giveUpAfterMs / frequency;
      const intervalId = setInterval(() => {
        console.log('Checking auth...');
        if (hasHealthcheckReceived) {
          console.log('Authenticated!');
          clearInterval(intervalId);
          resolve(ws);
        } else if (attempts < 1) {
          clearInterval(intervalId);
          console.warn('Unsuccessful authentication');
          ws.close(1111, 'Unsuccessful authentication');
          reject('Unsuccessful authentication');
        }
        attempts--;
      }, frequency);
    };

    const ws = new WebSocket(endpoint);
    ws.binaryType = 'arraybuffer';
    ws.onerror = onError;
    ws.onclose = onClose;
    ws.onopen = (e: Event) => {
      authenticate();

      if (onOpen) {
        onOpen.call(ws, e);
      }
    };

    ws.onmessage = (e: MessageEvent) => {
      if (!(e.data instanceof ArrayBuffer)) {
        console.error(`This socket only accepts exchanging binary data`);
        return;
      }

      const protoBinaryData = new Uint8Array(e.data);
      const message = WebsocketEvent.fromBinary(protoBinaryData);
      if (message.event.oneofKind === 'healthcheck') {
        hasHealthcheckReceived = true;
      }

      if (onMessage) {
        onMessage(message);
      }
    };
  });
};
