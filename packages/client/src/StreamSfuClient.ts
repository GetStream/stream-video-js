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

/**
 * The client used for exchanging information with the SFU.
 */
export class StreamSfuClient {
  /**
   * A buffer for ICE Candidates that are received before
   * the PeerConnections are ready to handle them.
   */
  readonly iceTrickleBuffer = new IceTrickleBuffer();
  /**
   * The `sessionId` of the currently connected participant.
   */
  readonly sessionId: string;

  /**
   * Holds the current WebSocket connection to the SFU.
   */
  signalWs: WebSocket;

  /**
   * Promise that resolves when the WebSocket connection is ready (open).
   */
  signalReady: Promise<WebSocket>;

  private readonly rpc: SignalServerClient;
  private readonly token: string;
  private keepAliveInterval?: NodeJS.Timeout;
  private connectionCheckTimeout?: NodeJS.Timeout;
  private pingIntervalInMs = 5 * 1000;
  private unhealthyTimeoutInMs = this.pingIntervalInMs + 5 * 1000;
  private lastMessageTimestamp?: Date;
  private readonly unsubscribeIceTrickle: () => void;

  constructor(dispatcher: Dispatcher, url: string, token: string) {
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
    this.unsubscribeIceTrickle = dispatcher.on('iceTrickle', (e) => {
      if (e.eventPayload.oneofKind !== 'iceTrickle') return;
      const { iceTrickle } = e.eventPayload;
      this.iceTrickleBuffer.push(iceTrickle);
    });

    this.signalWs = createWebSocketSignalChannel({
      endpoint: wsEndpoint,
      onMessage: (message) => {
        this.lastMessageTimestamp = new Date();
        this.scheduleConnectionCheck();
        dispatcher.dispatch(message);
      },
    });

    this.signalReady = new Promise((resolve) => {
      this.signalWs.addEventListener('open', () => {
        this.keepAlive();
        resolve(this.signalWs);
      });
    });
  }

  close = (code: number = 1000) => {
    this.signalWs.close(code, 'Requested signal connection close');

    this.unsubscribeIceTrickle();
    clearInterval(this.keepAliveInterval);
    clearTimeout(this.connectionCheckTimeout);
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

  private keepAlive = () => {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }
    this.keepAliveInterval = setInterval(() => {
      console.log('Sending healthCheckRequest to SFU');
      const message = SfuRequest.create({
        requestPayload: {
          oneofKind: 'healthCheckRequest',
          healthCheckRequest: {},
        },
      });
      void this.send(message);
    }, this.pingIntervalInMs);
  };

  private scheduleConnectionCheck = () => {
    if (this.connectionCheckTimeout) {
      clearTimeout(this.connectionCheckTimeout);
    }

    this.connectionCheckTimeout = setTimeout(() => {
      if (this.lastMessageTimestamp) {
        const timeSinceLastMessage =
          new Date().getTime() - this.lastMessageTimestamp.getTime();

        if (timeSinceLastMessage > this.unhealthyTimeoutInMs) {
          console.log('SFU connection unhealthy, closing');
          this.close(4001);
        }
      }
    }, this.unhealthyTimeoutInMs);
  };
}
