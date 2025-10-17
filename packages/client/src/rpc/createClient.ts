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
import type { Trace } from '../stats';
import type { SfuResponseWithError } from './retryable';
import type { ScopedLogger } from '../logger';
import type { LogLevel } from '@stream-io/logger';

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
  logger: ScopedLogger,
  level: LogLevel,
): RpcInterceptor => {
  return {
    interceptUnary: (
      next: NextUnaryFn,
      method: MethodInfo,
      input: object,
      options: RpcOptions,
    ): UnaryCall => {
      const invocation = next(method, input, options);
      logger[level](`Invoked SFU RPC method ${method.name}`, {
        request: invocation.request,
        headers: invocation.requestHeaders,
        response: invocation.response,
      });

      return invocation;
    },
  };
};

export const withRequestTracer = (trace: Trace): RpcInterceptor => {
  type RpcMethodNames = {
    [K in keyof SignalServerClient as Capitalize<K>]: boolean;
  };

  const traceError = (name: string, input: object, err: unknown) =>
    trace(`${name}OnFailure`, [err, input]);

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

      trace(method.name, input);
      const unaryCall = next(method, input, options);
      unaryCall.then(
        (invocation) => {
          const err = (invocation.response as SfuResponseWithError)?.error;
          if (err) traceError(method.name, input, err);
        },
        (err) => traceError(method.name, input, err),
      );
      return unaryCall;
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
