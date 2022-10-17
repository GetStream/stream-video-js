import {
  type VideoDimension,
  VideoQuality,
} from './gen/video/sfu/models/models';
import { SignalServerClient } from './gen/video/sfu/signal_rpc/signal.client';
import { createSignalClient, withHeaders } from './rpc';
import { createWebSocketSignalChannel } from './rtc/signal';
import {SfuRequest} from "./gen/video/sfu/event/events";

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn(`Invalid URL. Can't extract hostname from it.`, e);
    return url;
  }
};

export class StreamSfuClient {
  sfuHost: string;
  // we generate uuid session id client side
  sessionId: string;

  rpc: SignalServerClient;
  // Current JWT token
  token: string;
  signalReady: Promise<WebSocket>;

  constructor(url: string, token: string, sessionId: string) {
    this.sfuHost = hostnameFromUrl(url);
    this.sessionId = sessionId;
    this.token = token;
    this.rpc = createSignalClient({
      baseUrl: url,
      interceptors: [
        withHeaders({
          Authorization: `Bearer ${token}`,
        }),
      ],
    });

    this.signalReady = createWebSocketSignalChannel({
      endpoint: `ws://${this.sfuHost}:3031/ws`,
    });
  }

  close = () => {
    this.signalReady.then((s) => {
      this.signalReady = Promise.reject('Connection closed');
      s.close(1000, 'Requested signal connection close');
      // TODO OL: re-connect flow
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
}
