import {
  type VideoDimension,
  VideoQuality,
} from './gen/video/sfu/models/models';
import { SignalServerClient } from './gen/video/sfu/signal_rpc/signal.client';
import { createSignalClient, withHeaders } from './rpc';
import { createWebSocketSignalChannel } from './rtc/signal';
import { SfuRequest } from './gen/video/sfu/event/events';
import { Dispatcher } from './rtc/Dispatcher';
import { v4 as uuidv4 } from 'uuid';

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn(`Invalid URL. Can't extract hostname from it.`, e);
    return url;
  }
};

const toURL = (url: string) => {
  try {
    return new URL(url);
  } catch (e) {
    return null;
  }
};

export class StreamSfuClient {
  readonly dispatcher = new Dispatcher();
  sfuHost: string;
  // we generate uuid session id client side
  sessionId: string;

  rpc: SignalServerClient;
  // Current JWT token
  token: string;
  signalReady: Promise<WebSocket>;
  private keepAliveInterval: any;

  constructor(url: string, token: string, sessionId?: string) {
    this.sfuHost = hostnameFromUrl(url);
    this.sessionId = sessionId || uuidv4();
    console.warn(this.sessionId);
    this.token = token;
    this.rpc = createSignalClient({
      baseUrl: url,
      interceptors: [
        withHeaders({
          Authorization: `Bearer ${token}`,
        }),
      ],
    });

    // FIXME: OL: this should come from the coordinator API
    let wsEndpoint = `ws://${this.sfuHost}:3031/ws`;
    if (!['localhost', '127.0.0.1'].includes(this.sfuHost)) {
      const sfuUrl = toURL(url);
      if (sfuUrl) {
        sfuUrl.protocol = 'wss:';
        sfuUrl.pathname = '/ws';
        wsEndpoint = sfuUrl.toString();
      }
    }

    this.signalReady = createWebSocketSignalChannel({
      endpoint: wsEndpoint,
      onMessage: (message) => {
        this.dispatcher.dispatch(message);
      },
    });
  }

  close = () => {
    this.signalReady.then((ws) => {
      this.signalReady = Promise.reject('Connection closed');
      // TODO OL: re-connect flow
      ws.close(1000, 'Requested signal connection close');

      this.dispatcher.offAll();
      clearInterval(this.keepAliveInterval);
    });
  };

  updateAudioMuteState = async (muted: boolean) => {
    const { response } = this.rpc.updateMuteState({
      sessionId: this.sessionId,
      mute: {
        oneofKind: 'audioMuteChanged',
        audioMuteChanged: {
          muted,
        },
      },
    });
    return response;
  };

  updateVideoMuteState = async (muted: boolean) => {
    const { response } = await this.rpc.updateMuteState({
      sessionId: this.sessionId,
      mute: {
        oneofKind: 'videoMuteChanged',
        videoMuteChanged: {
          muted,
        },
      },
    });
    return response;
  };

  // FIXME: OL: introduced as a dev-tool. Do we need to keep it?
  requestVideoQuality = async (forUserId: string, quality: VideoQuality) => {
    return this.rpc.requestVideoQuality({
      sessionId: this.sessionId,
      streamQualities: [
        {
          userId: forUserId,
          videoQuality: quality,
        },
      ],
    });
  };

  updateSubscriptions = async (subscriptions: {
    [key: string]: VideoDimension;
  }) => {
    return this.rpc.updateSubscriptions({
      sessionId: this.sessionId,
      subscriptions,
    });
  };

  send = (message: SfuRequest) => {
    this.signalReady.then((signal) => {
      signal.send(SfuRequest.toBinary(message));
    });
  };

  // FIXME: make this private
  async keepAlive() {
    await this.signalReady;
    console.log('Registering healthcheck for SFU');
    this.keepAliveInterval = setInterval(() => {
      const message = SfuRequest.create({
        requestPayload: {
          oneofKind: 'healthCheckRequest',
          healthCheckRequest: {
            sessionId: this.sessionId,
          },
        },
      });
      console.log('Sending healthCheckRequest to SFU', message);
      this.send(message);
    }, 27000);
  }
}
