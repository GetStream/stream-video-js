import { ComponentType } from 'react';
import { LivestreamUI } from '../Livestream';
import { DefaultCallUI } from '../DefaultCall';

/**
 * Props passed to call type UI components.
 */
export interface CallTypeUIProps {
  skipLobby?: boolean;
}

/**
 * Call UI components mapped by call type.
 */
const CallTypeComponents: Record<string, ComponentType<CallTypeUIProps>> = {
  livestream: LivestreamUI,
  default: DefaultCallUI,
};

export interface CallRouterProps {
  callType: string;
  skipLobby?: boolean;
}

/**
 * Routes to the appropriate UI based on call type.
 */
export function CallRouter({ callType, skipLobby }: CallRouterProps) {
  const Component = CallTypeComponents[callType] ?? CallTypeComponents.default;
  return <Component skipLobby={skipLobby} />;
}
