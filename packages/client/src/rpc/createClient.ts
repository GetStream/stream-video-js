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
import type { Trace } from '../stats/rtc/types';

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
      let invocation: UnaryCall | undefined;
      try {
        invocation = next(method, input, options);
      } finally {
        logger(level, `Invoked SFU RPC method ${method.name}`, {
          request: invocation?.request,
          headers: invocation?.requestHeaders,
          response: invocation?.response,
        });
      }
      return invocation;
    },
  };
};

export const withRequestTracer = (trace: Trace): RpcInterceptor => {
  type RpcMethodNames = {
    [K in keyof SignalServerClient as Capitalize<K>]: boolean;
  };

  const exclusions: Record<string, boolean | undefined> = {
    SendStats: true,
  } satisfies Partial<RpcMethodNames>;
  return {
    interceptUnary(
      next: NextUnaryFn,
      method: MethodInfo,
      input: object,
      options: RpcOptions,
    ): UnaryCall {
      if (exclusions[method.name as keyof RpcMethodNames]) {
        return next(method, input, options);
      }
      try {
        trace(method.name, input);
        return next(method, input, options);
      } catch (err) {
        trace(`${method.name}OnFailure`, [input, err]);
        throw err;
      }
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
