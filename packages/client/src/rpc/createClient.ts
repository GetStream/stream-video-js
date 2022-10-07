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
import { ClientRPCClient } from '../gen/video/coordinator/client_v1_rpc/client_rpc.client';
import { SignalServerClient } from '../gen-sfu/sfu_signal_rpc/signal.client';

const defaultOptions: TwirpOptions = {
  baseUrl: '',
  sendJson: true,
};

export const withHeaders = (
  headers: Record<string, string>,
): RpcInterceptor => {
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
      Object.entries(headers).forEach(([header, value]) => {
        // @ts-ignore
        options.meta[header] = value;
      });
      return next(method, input, options);
    },
  };
};

export const createCoordinatorClient = (options?: TwirpOptions) => {
  const transport = new TwirpFetchTransport({
    ...defaultOptions,
    ...options,
  });

  return new ClientRPCClient(transport);
};

export const createSignalClient = (options?: TwirpOptions) => {
  const transport = new TwirpFetchTransport({
    ...defaultOptions,
    ...options,
  });

  return new SignalServerClient(transport);
};
