import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  version,
} from 'react';
import type { Call } from '@stream-io/video-client';
import { SdkRenderError } from '../errors';

/**
 * React 19 keeps the original component stack when a boundary rethrows the
 * same error object, so the error can be rethrown untouched from `render()`.
 */
const preservesRethrownComponentStack = parseInt(version, 10) >= 19;
const reportedErrors = new WeakSet<object>();
let captureSeq = 0;

const truncate = (value: string | null | undefined) => value?.slice(0, 2048);

/**
 * Reports a render error to the call's tracer, once per thrown object.
 * Never throws.
 */
const reportRenderError = (call: Call | undefined, thrown: unknown) => {
  if (!call) return;

  const isObject =
    (typeof thrown === 'object' && thrown !== null) ||
    typeof thrown === 'function';
  if (isObject) {
    if (reportedErrors.has(thrown)) return;
    reportedErrors.add(thrown);
  }

  try {
    const isWrapped = thrown instanceof SdkRenderError;
    const error = isWrapped ? thrown.cause : thrown;
    const componentStack = truncate(
      isWrapped ? thrown.componentStack : undefined,
    );
    const payload =
      error instanceof Error
        ? {
            name: error.name,
            message: truncate(error.message),
            stack: truncate(error.stack),
            componentStack,
          }
        : { message: truncate(String(error)), componentStack };
    call.tracer.trace('react.renderError', payload);
  } catch {
    // reporting must never interfere with the customer's error handling
  }
};

/**
 * Wraps an error with its component stack. Falls back to the original error
 * (e.g. for values that can't be stringified) so that `componentDidCatch` can
 * never throw a different error.
 */
const wrapRenderError = (error: unknown, componentStack?: string | null) => {
  try {
    return new SdkRenderError(error, componentStack ?? '');
  } catch {
    return error;
  }
};

type CapturedErrors = { [key: `captured:${number}`]: unknown };

type SdkErrorObserverState = {
  phase: 'ok' | 'captured' | 'rethrow';
} & CapturedErrors;

/**
 * Every `getDerivedStateFromError` call stores its error under a new key, so
 * errors captured in the same update are merged into state instead of
 * overwriting each other.
 */
const capturedErrors = (state: SdkErrorObserverState) =>
  Object.keys(state)
    .filter((key) => key.startsWith('captured:'))
    .map((key) => state[key as keyof CapturedErrors]);

type SdkErrorObserverProps = PropsWithChildren<{
  call?: Call;
}>;

/**
 * A transparent error boundary: it reports render errors to the call's tracer
 * and rethrows them to the closest error boundary above `<StreamCall>`.
 *
 * - React 19: the same error object is rethrown from `render()`.
 * - React 17/18: the boundary commits an empty tree once, so that
 *   `componentDidCatch` receives the original component stack, then rethrows
 *   the error wrapped in a `SdkRenderError` that carries that stack.
 *   An `SdkRenderError` coming from a nested observer is rethrown as is.
 *
 * When several errors are captured at once (e.g. two effects throwing in the
 * same commit), all of them are reported and the first one is rethrown.
 *
 * @internal
 */
export class SdkErrorObserver extends Component<
  SdkErrorObserverProps,
  SdkErrorObserverState
> {
  state: SdkErrorObserverState = { phase: 'ok' };
  private wrappedErrors: unknown[] = [];

  static getDerivedStateFromError = (
    error: unknown,
  ): Partial<SdkErrorObserverState> => {
    const phase =
      preservesRethrownComponentStack || error instanceof SdkRenderError
        ? 'rethrow'
        : 'captured';
    return { phase, [`captured:${captureSeq++}`]: error };
  };

  componentDidCatch = (error: unknown, info: ErrorInfo) => {
    this.wrappedErrors.push(wrapRenderError(error, info.componentStack));
    this.setState({ phase: 'rethrow' });
  };

  render = () => {
    const { state } = this;
    if (state.phase === 'rethrow') {
      const hasErrors = this.wrappedErrors.length > 0;
      const errors = hasErrors ? this.wrappedErrors : capturedErrors(state);
      for (const error of errors) reportRenderError(this.props.call, error);
      throw errors[0];
    }
    if (state.phase === 'captured') return null;
    return this.props.children;
  };
}
