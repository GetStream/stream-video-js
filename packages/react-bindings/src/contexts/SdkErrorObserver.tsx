import {
  Component,
  type ErrorInfo,
  type PropsWithChildren,
  version,
} from 'react';
import type { Call } from '@stream-io/video-client';

/**
 * React 19 keeps the original component stack when a boundary rethrows the
 * same error object, so the error can be rethrown untouched from `render()`.
 */
const preservesRethrownComponentStack = parseInt(version, 10) >= 19;
const reportedErrors = new WeakSet<object>();
const rethrownErrors = new WeakSet<object>();
let captureSeq = 0;

const isObject = (value: unknown): value is object =>
  (typeof value === 'object' && value !== null) || typeof value === 'function';

const truncate = (value: string | null | undefined) => value?.slice(0, 2048);

/**
 * Reports a render error to the call's tracer, once per thrown object.
 * Never throws.
 */
const reportRenderError = (
  call: Call | undefined,
  error: unknown,
  componentStack: string | undefined,
) => {
  if (!call) return;

  if (isObject(error)) {
    if (reportedErrors.has(error)) return;
    reportedErrors.add(error);
  }

  try {
    const payload =
      error instanceof Error
        ? {
            name: error.name,
            message: truncate(error.message),
            stack: truncate(error.stack),
            componentStack: truncate(componentStack),
          }
        : {
            message: truncate(String(error)),
            componentStack: truncate(componentStack),
          };
    call.tracer.trace('react.renderError', payload);
  } catch {
    // reporting must never interfere with the customer's error handling
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
 * The same error object is always rethrown, so customer boundaries and
 * monitoring tools receive exactly what was thrown.
 *
 * - React 19: the error is rethrown from `render()` right away, and React
 *   keeps its original component stack.
 * - React 17/18: the boundary commits an empty tree once, so that
 *   `componentDidCatch` receives the original component stack for reporting,
 *   then rethrows. Customer boundaries see a component stack that starts at
 *   this boundary, as React 17/18 compute it from the rethrowing component.
 *   Errors already rethrown by a nested observer skip the empty commit.
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
  private componentStacks = new Map<unknown, string | undefined>();

  static getDerivedStateFromError = (
    error: unknown,
  ): Partial<SdkErrorObserverState> => {
    const phase =
      preservesRethrownComponentStack ||
      (isObject(error) && rethrownErrors.has(error))
        ? 'rethrow'
        : 'captured';
    return { phase, [`captured:${captureSeq++}`]: error };
  };

  componentDidCatch = (error: unknown, info: ErrorInfo) => {
    this.componentStacks.set(error, info.componentStack ?? undefined);
    this.setState({ phase: 'rethrow' });
  };

  render = () => {
    const { state } = this;
    if (state.phase === 'rethrow') {
      const errors = capturedErrors(state);
      for (const error of errors) {
        const componentStack = this.componentStacks.get(error);
        reportRenderError(this.props.call, error, componentStack);
      }
      const [error] = errors;
      if (isObject(error)) rethrownErrors.add(error);
      throw error;
    }
    if (state.phase === 'captured') return null;
    return this.props.children;
  };
}
