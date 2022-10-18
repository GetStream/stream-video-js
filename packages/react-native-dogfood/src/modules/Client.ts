import {User} from './User';
import {SignalServerClient} from '../../gen/sfu_signal_rpc/signal.client';
import 'react-native-get-random-values';
import {v4 as uuidv4} from 'uuid';
import {TwirpFetchTransport, TwirpOptions} from '@protobuf-ts/twirp-transport';
import type {
  MethodInfo,
  NextUnaryFn,
  RpcInterceptor,
  RpcOptions,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';
import {SFU_HOSTNAME} from '../../App';
import {VideoDimension} from '../../gen/sfu_models/models';

const defaultOptions: TwirpOptions = {
  baseUrl: 'http://localhost:3031',
  sendJson: true,
};

export const withBearerToken = (token: string): RpcInterceptor => {
  return {
    interceptUnary(
      next: NextUnaryFn,
      method: MethodInfo,
      input: object,
      options: RpcOptions,
    ): UnaryCall {
      if (!options.meta) {
        options.meta = {};
      }
      options.meta.Authorization = `Bearer ${token}`;
      return next(method, input, options);
    },
  };
};

export const createClient = (options?: TwirpOptions) => {
  const transport = new TwirpFetchTransport({
    ...defaultOptions,
    ...options,
  });

  return new SignalServerClient(transport);
};

export class Client {
  user: User;
  sfuHost: string;
  sessionId: string;
  rpc: SignalServerClient;

  constructor(url: string, user: User) {
    this.user = user;
    this.sfuHost = SFU_HOSTNAME;
    this.sessionId = uuidv4();
    this.rpc = createClient({
      baseUrl: url,
      interceptors: [withBearerToken(user.token)],
    });
  }

  refreshSessionId() {
    this.sessionId = uuidv4();
  }

  updateSubscriptions = async (subscriptions: {
    [key: string]: VideoDimension;
  }) => {
    return this.rpc.updateSubscriptions({
      sessionId: this.sessionId,
      subscriptions,
    });
  };

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
}
