import {
  WebsocketAuthRequest,
  WebsocketClientEvent,
  WebsocketEvent,
  WebsocketHealthcheck,
} from '../gen/video/coordinator/client_v1_rpc/websocket';
import { UserInput } from '../gen/video/coordinator/user_v1/user';
import { KeepAlive, keepAlive } from './keepAlive';

import type { StreamEventListener, StreamWSClient } from './types';
import { createCoordinatorWebSocket } from './socket';

const WS_STATE_OPEN = 1;

export class StreamWebSocketClient implements StreamWSClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly token: string;
  private readonly user: UserInput;

  private subscribers: { [event: string]: StreamEventListener<any>[] } = {};

  private ws?: WebSocket;
  public keepAlive: KeepAlive;

  constructor(
    endpoint: string,
    apiKey: string,
    token: string,
    user: UserInput,
  ) {
    this.endpoint = endpoint;
    this.apiKey = apiKey;
    this.token = token;
    this.user = user;

    this.keepAlive = keepAlive(
      this,
      20 * 1000, // in seconds
    );
  }

  connect = async () => {
    if (this.ws) {
      console.warn(
        `WebSocket connection is already established. Disconnect first.`,
      );
      return;
    }

    const catchOneHealthcheckMessage = (healthcheck: WebsocketHealthcheck) => {
      this.keepAlive.setPayload(
        WebsocketClientEvent.toBinary({
          event: {
            oneofKind: 'healthcheck',
            healthcheck,
          },
        }),
      );
      this.off('healthcheck', catchOneHealthcheckMessage);
    };
    this.on('healthcheck', catchOneHealthcheckMessage);

    const authRequest: WebsocketAuthRequest = {
      token: this.token,
      user: this.user,
      apiKey: this.apiKey,
    };

    this.ws = await createCoordinatorWebSocket(this.endpoint, authRequest, {
      onMessage: (message: WebsocketEvent) => {
        this.keepAlive.schedulePing();
        this.dispatchMessage(message);
      },

      onOpen: (e) => {
        console.log(`Connection established`, this.ws?.url, e);
      },

      onClose: (e) => {
        console.warn(`Connection closed`, e);
        this.off('healthcheck', catchOneHealthcheckMessage);
        this.keepAlive.cancelPendingPing();
      },

      onError: (e) => {
        console.error(`An error has occurred`, e);
        this.off('healthcheck', catchOneHealthcheckMessage);
        this.keepAlive.cancelPendingPing();
      },
    });
  };

  // TODO fix types
  private dispatchMessage = (message: WebsocketEvent) => {
    const { event, ...envelopes } = message;
    const eventKind = event.oneofKind;
    if (!eventKind) return;

    // @ts-ignore
    const wrappedMessage = event[eventKind];
    console.log('Dispatching', eventKind, message);

    const eventListeners = this.subscribers[eventKind];
    eventListeners?.forEach((fn) => {
      try {
        fn(wrappedMessage, envelopes);
      } catch (e) {
        console.warn(`Listener failed with error`, e);
      }
    });
  };

  disconnect = () => {
    // FIXME: OL: do proper cleanup of resources here.
    console.log(`Disconnect requested`);
    this.keepAlive.cancelPendingPing();
    this.ws?.close(3939, `Disconnect requested`);
    this.ws = undefined;
  };

  sendMessage = (data: Uint8Array) => {
    if (!this.ws || this.ws.readyState !== WS_STATE_OPEN) {
      console.warn(`WebSocket isn't ready to send messages`);
      return;
    }
    this.ws.send(data);
    this.keepAlive.schedulePing();
  };

  on = <T>(event: string, fn: StreamEventListener<T>) => {
    console.log('Attaching listener for', event);
    const listeners = this.subscribers[event] || [];
    listeners.push(fn);
    this.subscribers[event] = listeners;
    return () => {
      this.off(event, fn);
    };
  };

  off = <T>(event: string, fn: StreamEventListener<T>) => {
    this.subscribers[event] = (this.subscribers[event] || []).filter(
      (f) => f !== fn,
    );
  };
}
