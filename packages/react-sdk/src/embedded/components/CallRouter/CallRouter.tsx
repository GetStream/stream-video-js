import { ComponentType } from 'react';
import { LivestreamUI } from '../Livestream';
import { DefaultCallUI } from '../DefaultCall';
import { useWakeLock } from '../../hooks';

/**
 * Call UI components mapped by call type.
 */
const CallTypeComponents: Record<string, ComponentType> = {
  livestream: LivestreamUI,
  default: DefaultCallUI,
};

export interface CallRouterProps {
  callType: string;
}

/**
 * Routes to the appropriate UI based on call type.
 */
export function CallRouter({ callType }: CallRouterProps) {
  useWakeLock();

  const Component = CallTypeComponents[callType] ?? CallTypeComponents.default;

  return <Component />;
}
