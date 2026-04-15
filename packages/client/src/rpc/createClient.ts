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

export const TIMEOUT_SYMBOL = '@@stream-io/timeout';

export const withTimeout = (
  timeoutMs: number,
  trace?: Trace,
): RpcInterceptor => {
  const scheduleTimeout = (methodName: string) => {
    const controller = new AbortController();
    // aborts with specially crafted error that can be reliably recognized by
    // @protobuf-ts/twirp-transport and our internal retry logic.
    // https://github.com/timostamm/protobuf-ts/blob/657e64e80009e503e94f608fda423fbcbf4fb5a7/packages/twirp-transport/src/twirp-transport.ts#L102-L107
    const timeoutId = setTimeout(() => {
      trace?.(`${methodName}Timeout`, [timeoutMs]);
      const error = new Error(TIMEOUT_SYMBOL);
      error.name = 'AbortError';
      controller.abort(error);
    }, timeoutMs);
    return [controller.signal, () => clearTimeout(timeoutId)] as const;
  };

  return {
    interceptUnary(
      next: NextUnaryFn,
      method: MethodInfo,
      input: object,
      options: RpcOptions,
    ): UnaryCall {
      // respect external abort signals if provided
      if (options.abort) return next(method, input, options);

      // set up a custom abort signal for the RPC call
      const [signal, cancel] = scheduleTimeout(method.name);
      const invocation = next(method, input, { ...options, abort: signal });
      invocation.then(cancel, cancel);

      return invocation;
    },
  };
};

export const withRequestLogger = (
  logger: ScopedLogger,
  level: LogLevel = 'trace',
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
  const exclusions = new Set<RpcMethodName>(['SendStats']);
  const responseInclusions = new Set<RpcMethodName>(['SetPublisher']);

  const traceError = (name: string, input: object, err: unknown) =>
    trace(`${name}OnFailure`, [err, input]);

  return {
    interceptUnary(
      next: NextUnaryFn,
      method: MethodInfo,
      input: object,
      options: RpcOptions,
    ): UnaryCall {
      const methodName = method.name as RpcMethodName;
      if (exclusions.has(methodName)) return next(method, input, options);

      const { invocationMeta: { attempt = 0 } = {} } = options;
      const traceName =
        attempt === 0 ? methodName : `${methodName}(${attempt})`;
      trace(traceName, input);

      const unaryCall = next(method, input, options);
      unaryCall.then(
        (invocation) => {
          const response = invocation.response as SfuResponseWithError;
          if (response.error) traceError(traceName, input, response.error);
          if (responseInclusions.has(methodName)) {
            trace(`${traceName}Response`, response);
          }
        },
        (error) => traceError(methodName, input, error),
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
