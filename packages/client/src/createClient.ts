import {
  TwirpFetchTransport,
  TwirpOptions,
} from '@protobuf-ts/twirp-transport';
import { CallCoordinatorServiceClient } from './gen/video_coordinator_rpc/coordinator_service.client';
import type {
  RpcOptions,
  RpcInterceptor,
  NextUnaryFn,
  MethodInfo,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';

const defaultOptions: TwirpOptions = {
  baseUrl: '',
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
      options.meta['Authorization'] = `Bearer ${token}`;
      return next(method, input, options);
    },
  };
};

export const createClient = (options?: TwirpOptions) => {
  const transport = new TwirpFetchTransport({
    ...defaultOptions,
    ...options,
  });

  return new CallCoordinatorServiceClient(transport);
};
