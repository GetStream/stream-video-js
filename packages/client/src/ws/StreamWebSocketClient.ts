import { keepAlive } from './keepAlive';
import { AuthPayload, WebsocketEvent } from '../gen/video_events/events';

import type { StreamWSClient, StreamEventListener } from './types';
import { CreateUserRequest } from '../gen/video_coordinator_rpc/coordinator_service';

export class StreamWebSocketClient implements StreamWSClient {
  private readonly ws: WebSocket;
  private readonly token: string;
  private readonly user: CreateUserRequest;

  private subscribers: { [event: string]: StreamEventListener[] } = {};
  private hasReceivedMessage = false;
  private keepAlive: {
    cancelPendingPing: () => void;
    schedulePing: (data?: Uint8Array) => void;
  };

  constructor(endpoint: string, token: string, user: CreateUserRequest) {
    const ws = new WebSocket(endpoint);
    ws.binaryType = 'arraybuffer';
    ws.onerror = this.onConnectionError;
    ws.onclose = this.onConnectionClose;
    ws.onopen = this.onConnectionOpen;
    ws.onmessage = this.onMessage;

    this.token = token;
    this.user = user;
    this.ws = ws;

    this.keepAlive = keepAlive(
      this,
      8 * 1000, // in seconds
      CreateUserRequest.toBinary(user),
    );
  }

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
    console.debug(`Message received`, e.data);
    this.keepAlive.schedulePing();

    if (!(e.data instanceof ArrayBuffer)) {
      console.error(`This socket only accepts exchanging binary data`);
      return;
    }

    const data = new Uint8Array(e.data);
    const message = WebsocketEvent.fromBinary(data);

    // submit the message for processing
    this.dispatchMessage(message);
  };

  private authenticate = () => {
    console.log('Authenticating...');
    this.sendMessage(
      AuthPayload.toBinary({
        token: this.token,
        user: this.user,
      }),
    );
  };

  // TODO fix types
  private dispatchMessage = (message: WebsocketEvent) => {
    // FIXME OL: POC: temporary flag, used for auth checks
    this.hasReceivedMessage = true;

    const eventKind = message.eventPayload.oneofKind;
    console.log('Dispatching', eventKind, message.eventPayload);
    if (eventKind) {
      // @ts-ignore TODO: fix types
      const wrappedMessage = message.eventPayload[eventKind];
      const eventListeners = this.subscribers[eventKind];
      eventListeners?.forEach((fn: StreamEventListener) => {
        try {
          fn(wrappedMessage);
        } catch (e) {
          console.warn(`Listener failed with error`, e);
        }
      });
    }
  };

  disconnect = () => {
    // FIXME: OL: do proper cleanup of resources here.
    console.log(`Disconnect requested`);
    this.keepAlive.cancelPendingPing();
    this.ws.close(1000, `Disconnect requested`);
  };

  ensureAuthenticated = async () => {
    // FIXME OL: POC: find more elegant way to accomplish this.
    return new Promise<void>((resolve, reject) => {
      const giveUpAfterMs = 3000;
      const frequency = 100;
      let attempts = giveUpAfterMs / frequency;
      let q = setInterval(() => {
        console.log('Checking...');
        if (this.hasReceivedMessage) {
          clearInterval(q);
          resolve();
        } else if (attempts < 1) {
          clearInterval(q);
          reject('Unsuccessful authentication');
        }
        attempts--;
      }, frequency);
    });
  };

  sendMessage = (data: Uint8Array) => {
    this.ws.send(data);
    this.keepAlive.schedulePing();
  };

  on = (event: string, fn: StreamEventListener) => {
    const listeners = this.subscribers[event] || [];
    listeners.push(fn);
    this.subscribers[event] = listeners;
    return () => {
      this.off(event, fn);
    };
  };

  off = (event: string, fn: StreamEventListener) => {
    this.subscribers[event] = (this.subscribers[event] || []).filter(
      (f) => f !== fn,
    );
  };
}
