import { SignalServerClient } from './gen/video/sfu/signal_rpc/signal.client';
import { createSignalClient, withHeaders } from './rpc';
import { createWebSocketSignalChannel } from './rtc/signal';
import { JoinRequest, SfuRequest } from './gen/video/sfu/event/events';
import { Dispatcher } from './rtc/Dispatcher';
import { v4 as uuidv4 } from 'uuid';
import { IceTrickleBuffer } from './rtc/IceTrickleBuffer';
import {
  SendAnswerRequest,
  SetPublisherRequest,
  TrackSubscriptionDetails,
  UpdateMuteStatesRequest,
} from './gen/video/sfu/signal_rpc/signal';
import { ICETrickle, TrackType } from './gen/video/sfu/models/models';

const hostnameFromUrl = (url: string) => {
  try {
    const u = new URL(url);
    return {
      hostname: u.hostname,
      port: u.port,
    };
  } catch (e) {
    console.warn(`Invalid URL. Can't extract hostname from it.`, e);
    return {
      hostname: url,
      port: 3031,
    };
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
  readonly iceTrickleBuffer = new IceTrickleBuffer();
  // we generate uuid session id client side
  readonly sessionId: string;
  private readonly rpc: SignalServerClient;
  // Current JWT token
  private readonly token: string;
  signalReady: Promise<WebSocket>;
  private keepAliveInterval?: NodeJS.Timeout;

  constructor(url: string, token: string) {
    this.sessionId = uuidv4();
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
    const { hostname, port } = hostnameFromUrl(url);
    let wsEndpoint = `ws://${hostname}:${port}/ws`;
    if (!['localhost', '127.0.0.1'].includes(hostname)) {
      const sfuUrl = toURL(url);
      if (sfuUrl) {
        sfuUrl.protocol = 'wss:';
        sfuUrl.pathname = '/ws';
        wsEndpoint = sfuUrl.toString();
      }
    }

    // Special handling for the ICETrickle kind of events.
    // These events might be triggered by the SFU before the initial RTC
    // connection is established. In that case, those events (ICE candidates)
    // need to be buffered and later added to the appropriate PeerConnection
    // once the remoteDescription is known and set.
    this.dispatcher.on('iceTrickle', (e) => {
      if (e.eventPayload.oneofKind !== 'iceTrickle') return;
      const { iceTrickle } = e.eventPayload;
      this.iceTrickleBuffer.push(iceTrickle);
    });

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

  updateSubscriptions = async (subscriptions: TrackSubscriptionDetails[]) => {
    return this.rpc.updateSubscriptions({
      sessionId: this.sessionId,
      tracks: subscriptions,
    });
  };

  setPublisher = async (data: Omit<SetPublisherRequest, 'sessionId'>) => {
    return this.rpc.setPublisher({
      ...data,
      sessionId: this.sessionId,
    });
  };

  sendAnswer = async (data: Omit<SendAnswerRequest, 'sessionId'>) => {
    return this.rpc.sendAnswer({
      ...data,
      sessionId: this.sessionId,
    });
  };

  iceTrickle = async (data: Omit<ICETrickle, 'sessionId'>) => {
    return this.rpc.iceTrickle({
      ...data,
      sessionId: this.sessionId,
    });
  };

  updateMuteState = async (trackType: TrackType, muted: boolean) => {
    return this.updateMuteStates({
      muteStates: [
        {
          trackType,
          muted,
        },
      ],
    });
  };

  updateMuteStates = async (
    data: Omit<UpdateMuteStatesRequest, 'sessionId'>,
  ) => {
    return this.rpc.updateMuteStates({
      ...data,
      sessionId: this.sessionId,
    });
  };

  join = async (data: Omit<JoinRequest, 'sessionId' | 'token'>) => {
    const joinRequest = JoinRequest.create({
      ...data,
      sessionId: this.sessionId,
      token: this.token,
    });
    return this.send(
      SfuRequest.create({
        requestPayload: {
          oneofKind: 'joinRequest',
          joinRequest,
        },
      }),
    );
  };

  send = (message: SfuRequest) => {
    return this.signalReady.then((signal) => {
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
