import type {
  MethodInfo,
  NextUnaryFn,
  RpcInterceptor,
  RpcOptions,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';
import {
  TwirpFetchTransport,
  TwirpOptions,
} from '@protobuf-ts/twirp-transport';
import { ClientRPCClient } from '../gen/client_v1_rpc/client_rpc.client';

const defaultOptions: TwirpOptions = {
  baseUrl: '',
  sendJson: true,
};

export const withAuth = (apiKey: string, token: string): RpcInterceptor => {
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
      options.meta['api_key'] = apiKey;
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

  return new ClientRPCClient(transport);
};
