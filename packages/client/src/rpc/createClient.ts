import {
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
import { SignalServerClient } from '../gen/video/sfu/signal_rpc/signal.client';
import { Logger, LogLevel } from '../coordinator/connection/types';

const defaultOptions: TwirpOptions = {
  baseUrl: '',
  sendJson: true,
  timeout: 5 * 1000, // ms.
  jsonOptions: {
    ignoreUnknownFields: true,
  },
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
      options.meta = { ...options.meta, ...headers };
      return next(method, input, options);
    },
  };
};

export const withRequestLogger = (
  logger: Logger,
  level: LogLevel,
): RpcInterceptor => {
  return {
    interceptUnary: (
      next: NextUnaryFn,
      method: MethodInfo,
      input: object,
      options: RpcOptions,
    ): UnaryCall => {
      logger(level, `Calling SFU RPC method ${method.name}`, {
        input,
        options,
      });
      return next(method, input, options);
    },
  };
};

/**
 * Creates new SignalServerClient instance.
 *
 * @param options the twirp options.
 */
export const createSignalClient = (options?: TwirpOptions) => {
  const transport = new TwirpFetchTransport({
    ...defaultOptions,
    ...options,
  });

  return new SignalServerClient(transport);
};
