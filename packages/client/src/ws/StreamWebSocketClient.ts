import { keepAlive } from './keepAlive';
import { UserRequest } from '../gen/video_models/models';
import { AuthPayload, WebsocketEvent } from '../gen/video_events/events';

import  WebSocket from 'isomorphic-ws';
import type { StreamWSClient } from './types';

export class StreamWebSocketClient implements StreamWSClient {
  private readonly ws: WebSocket;
  private readonly token: string;
  private readonly user: UserRequest;

  private readonly schedulePing: () => void;

  private subscribers: { [event: string]: EventListener[] } = {};
  private hasReceivedMessage = false;

  constructor(endpoint: string, token: string, user: UserRequest) {
    const ws = new WebSocket(endpoint);
    ws.binaryType = 'arraybuffer';
    ws.onerror = this.onConnectionError;
    ws.onclose = this.onConnectionClose;
    ws.onopen = this.onConnectionOpen;
    ws.onmessage = this.onMessage;

    this.token = token;
    this.user = user;
    this.ws = ws;
    this.schedulePing = keepAlive(this, 27 * 1000); // seconds
  }

  private onConnectionError = (event: WebSocket.Event) => {
    console.error(`An error has occurred`, event);
  };

  private onConnectionClose = (event: WebSocket.CloseEvent) => {
    console.warn(`Connection closed`, event);
  };

  private onConnectionOpen = (event: WebSocket.Event) => {
    console.log(`Connection established`, this.ws.url, event);

    this.authenticate();
  };

  private onMessage = (event: WebSocket.MessageEvent) => {
    console.debug(`Message received`, event.data);
    this.schedulePing();

    if (!(event.data instanceof ArrayBuffer)) {
      console.error(`This socket only accepts exchanging binary data`);
      return;
    }

    const data = new Uint8Array(event.data);
    const message = WebsocketEvent.fromBinary(data);
    console.log('FUCKING MESSAGE');

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
    console.log('Dispatching', message);
    // FIXME OL: POC: temporary flag, used for auth checks

    // @ts-ignore

    console.log('Dispatching', message.eventPayload.oneofKind);
    // @ts-ignore
    this.subscribers[message.eventPayload.oneofKind]?.forEach((m: WebsocketEvent) =>{
      console.log('Dispatching to', m);
    });

    this.hasReceivedMessage = true;
  };

  disconnect = () => {
    // FIXME: OL: do proper cleanup of resources here.
    console.log(`Disconnect requested`);
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
    this.schedulePing();
  };

  on = (event: string, fn: EventListener) => {
    const listeners = this.subscribers[event] || [];
    listeners.push(fn);
    this.subscribers[event] = listeners;
    console.log('listeners to', this.subscribers);

    return () => {
      this.off(event, fn);
    };
  };

  off = (event: string, fn: EventListener) => {
    this.subscribers[event] = (this.subscribers[event] || []).filter(
      (f) => f !== fn,
    );
  };
}
