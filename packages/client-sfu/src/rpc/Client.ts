import { VideoDimension, VideoQuality } from '../gen/sfu_models/models';
import { SignalServerClient } from '../gen/sfu_signal_rpc/signal.client';
import { createClient, withBearerToken } from './createClient';
import { Logger } from './types';
import { IceCandidateRequest } from '../gen/sfu_signal_rpc/signal';

export class User {
  name: string;
  token: string;

  constructor(name: string, token: string) {
    this.name = name;
    this.token = token;
  }
}

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn(`Invalid URL. Can't extract hostname from it.`, e);
    return url;
  }
};

export class Client {
  // A user object
  user: User;

  sfuHost: string;
  // we generate uuid session id client side
  sessionId: string;
  // Client to make Twirp style API calls
  rpc: SignalServerClient;

  logger: Logger;

  constructor(url: string, user: User, sessionId: string) {
    this.user = user;
    this.sfuHost = hostnameFromUrl(url);
    this.rpc = createClient({
      baseUrl: url,
      interceptors: [withBearerToken(user.token)],
    });

    this.sessionId = sessionId;

    this.logger = (l, m, e) => {
      console.log(m);
    };
  }

  updateAudioMuteState = async (muted: boolean) => {
    return this.rpc.updateMuteState({
      sessionId: this.sessionId,
      mute: {
        oneofKind: 'audioMuteChanged',
        audioMuteChanged: {
          muted,
        },
      },
    });
  };

  updateVideoMuteState = async (muted: boolean) => {
    return this.rpc.updateMuteState({
      sessionId: this.sessionId,
      mute: {
        oneofKind: 'videoMuteChanged',
        videoMuteChanged: {
          muted,
        },
      },
    });
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
