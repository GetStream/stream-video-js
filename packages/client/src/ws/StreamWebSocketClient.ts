import {
  WebsocketClientEvent,
  WebsocketEvent,
  WebsocketHealthcheck,
} from '../gen/video/coordinator/client_v1_rpc/websocket';
import { UserInput } from '../gen/video/coordinator/user_v1/user';
import { KeepAlive, keepAlive } from './keepAlive';

import type { StreamEventListener, StreamWSClient } from './types';

export class StreamWebSocketClient implements StreamWSClient {
  private readonly endpoint: string;
  private readonly apiKey: string;
  private readonly token: string;
  private readonly user: UserInput;

  private subscribers: { [event: string]: StreamEventListener<any>[] } = {};
  private authenticated: Promise<boolean> | undefined;

  private ws: WebSocket;
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

    this.ws = this.connectTo(endpoint);
    this.keepAlive = keepAlive(
      this,
      20 * 1000, // in seconds
    );
  }

  private connectTo = (endpoint: string) => {
    // open new socket connection
    const ws = new WebSocket(endpoint);
    ws.binaryType = 'arraybuffer';
    ws.onerror = this.onConnectionError;
    ws.onclose = this.onConnectionClose;
    ws.onopen = this.onConnectionOpen;
    ws.onmessage = this.onMessage;

    return ws;
  };

  private onConnectionError = (e: Event) => {
    console.error(`An error has occurred`, e);
  };

  private onConnectionClose = (e: CloseEvent) => {
    console.warn(`Connection closed`, e);
  };

  private onConnectionOpen = (e: Event) => {
    console.log(`Connection established`, this.ws.url, e);

    this.authenticate();
  };

  private onMessage = (e: MessageEvent) => {
    this.keepAlive.schedulePing();

    if (!(e.data instanceof ArrayBuffer)) {
      console.error(`This socket only accepts exchanging binary data`);
      return;
    }

    const protoBinaryData = new Uint8Array(e.data);
    const message = WebsocketEvent.fromBinary(protoBinaryData);

    // submit the message for processing
    this.dispatchMessage(message);
  };

  private authenticate = () => {
    console.log('Authenticating...');

    let hasReceivedHealthCheck = false;
    const catchOneHealthcheckMessage = (hc: WebsocketHealthcheck) => {
      hasReceivedHealthCheck = true;
      this.keepAlive.setPayload(WebsocketHealthcheck.toBinary(hc));
      this.off('healthcheck', catchOneHealthcheckMessage);
    };
    this.on('healthcheck', catchOneHealthcheckMessage);

    // FIXME OL: POC: find more elegant way to accomplish this.
    this.authenticated = new Promise<boolean>((resolve, reject) => {
      const giveUpAfterMs = 3500;
      const frequency = 250;
      let attempts = giveUpAfterMs / frequency;
      const intervalId = setInterval(() => {
        console.log('Checking auth...');
        if (hasReceivedHealthCheck) {
          console.log('Authenticated!');
          clearInterval(intervalId);
          resolve(true);
        } else if (attempts < 1) {
          clearInterval(intervalId);
          reject('Unsuccessful authentication');
        }
        attempts--;
      }, frequency);
    });

    // send the authorization message, in case all is good, the server
    // will respond with `Healthcheck`. Upon receiving the message, we consider
    // successful authorization
    this.ws.send(
      WebsocketClientEvent.toBinary({
        event: {
          oneofKind: 'authRequest',
          authRequest: {
            token: this.token,
            user: this.user,
            apiKey: this.apiKey,
          },
        },
      }),
    );
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
    this.ws.close(3939, `Disconnect requested`);
    this.authenticated = undefined;
  };

  ensureAuthenticated = async () => {
    return this.authenticated;
  };

  sendMessage = async (data: Uint8Array) => {
    await this.ensureAuthenticated();

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
