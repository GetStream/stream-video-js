import { ComponentType, lazy, Suspense } from 'react';
import { LoadingScreen } from '../shared';

/**
 * Props passed to call type UI components.
 */
interface CallTypeUIProps {
  skipLobby?: boolean;
}

/**
 * Lazy-loaded call UI components mapped by call type.
 * Add new call types here to support different UI flows.
 */
const CallTypeComponents: Record<string, ComponentType<CallTypeUIProps>> = {
  livestream: lazy(() =>
    import('../Livestream').then((m) => ({ default: m.LivestreamUI })),
  ),
  default: lazy(() =>
    import('../DefaultCall').then((m) => ({ default: m.DefaultCallUI })),
  ),
};

export interface CallRouterProps {
  callType: string;
}

/**
 * Routes to the appropriate UI based on call type.
 */
export function CallRouter({ callType }: CallRouterProps) {
  const Component = CallTypeComponents[callType] ?? CallTypeComponents.default;

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component />
    </Suspense>
  );
}
