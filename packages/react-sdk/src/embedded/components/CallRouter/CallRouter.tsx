import { ComponentType } from 'react';
import { LivestreamUI } from '../Livestream';
import { DefaultCallUI } from '../DefaultCall';

/**
 * Props passed to call type UI components.
 */
export interface CallTypeUIProps {
  skipLobby?: boolean;
  onJoin?: (name: string) => void;
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
  onJoin?: (name: string) => void;
}

/**
 * Routes to the appropriate UI based on call type.
 */
export function CallRouter({ callType, onJoin }: CallRouterProps) {
  const Component = CallTypeComponents[callType] ?? CallTypeComponents.default;
  return <Component onJoin={onJoin} />;
}
