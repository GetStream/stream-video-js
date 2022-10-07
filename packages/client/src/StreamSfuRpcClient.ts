import { VideoDimension, VideoQuality } from './gen-sfu/sfu_models/models';
import { SignalServerClient } from './gen-sfu/sfu_signal_rpc/signal.client';
import { IceCandidateRequest } from './gen-sfu/sfu_signal_rpc/signal';
import { createSignalClient, withHeaders } from './rpc';

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn(`Invalid URL. Can't extract hostname from it.`, e);
    return url;
  }
};

export class StreamSfuRpcClient {
  sfuHost: string;
  // we generate uuid session id client side
  sessionId: string;
  // Client to make Twirp style API calls
  rpc: SignalServerClient;

  constructor(url: string, token: string, sessionId: string) {
    this.sfuHost = hostnameFromUrl(url);
    this.rpc = createSignalClient({
      baseUrl: url,
      interceptors: [
        withHeaders({
          Authorization: `Bearer ${token}`,
        }),
      ],
    });

    this.sessionId = sessionId;
  }

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

  sendIceCandidate = async (data: Omit<IceCandidateRequest, 'sessionId'>) => {
    return this.rpc.sendIceCandidate({
      ...data,
      sessionId: this.sessionId,
    });
  };
}
