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
  type RpcMethodName = Capitalize<keyof SignalServerClient>;

  // requests to exclude from tracings
  const exclusions: Partial<Record<RpcMethodName, boolean>> = {
    SendStats: true,
  };

  // responses to include in tracings
  const responseInclusions: Partial<Record<RpcMethodName, boolean>> = {
    SetPublisher: true,
  };

  const traceError = (name: string, input: object, err: unknown) =>
    trace(`${name}OnFailure`, [err, input]);

  const traceResponse = (
    name: RpcMethodName,
    input: object,
    response: SfuResponseWithError,
  ) => {
    if (response.error) traceError(name, input, response.error);
    if (responseInclusions[name]) trace(`${name}Response`, response);
  };

  return {
    interceptUnary(
      next: NextUnaryFn,
      method: MethodInfo,
      input: object,
      options: RpcOptions,
    ): UnaryCall {
      const name = method.name as RpcMethodName;
      if (exclusions[name]) return next(method, input, options);

      trace(name, input);
      const unaryCall = next(method, input, options);
      unaryCall.then(
        (invocation) => traceResponse(name, input, invocation.response),
        (error) => traceError(name, input, error),
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
