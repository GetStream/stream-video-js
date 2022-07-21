import {
  TwirpFetchTransport,
  TwirpOptions,
} from '@protobuf-ts/twirp-transport';
import { CallCoordinatorServiceClient } from '../gen/video_coordinator_rpc/coordinator_service.client';
import type {
  MethodInfo,
  NextUnaryFn,
  RpcInterceptor,
  RpcOptions,
  UnaryCall,
} from '@protobuf-ts/runtime-rpc';

const defaultOptions: TwirpOptions = {
  baseUrl: '',
  sendJson: true,
};

import {default as fetch, Headers} from "node-fetch";

// fetch polyfill via https://github.com/node-fetch/node-fetch
globalThis.fetch = fetch as any;
globalThis.Headers = Headers as any;

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
