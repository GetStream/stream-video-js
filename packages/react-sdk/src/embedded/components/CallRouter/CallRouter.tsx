import { ComponentType } from 'react';
import { LivestreamUI } from '../Livestream';
import { DefaultCallUI } from '../DefaultCall';
import { useWakeLock } from '../../hooks';
import { usePersistedDevicePreferences } from '../../../hooks';

const DEVICE_PREFERENCES_KEY = '@stream-io/embedded-device-preferences';

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
  usePersistedDevicePreferences(DEVICE_PREFERENCES_KEY);
  useWakeLock();

  const Component = CallTypeComponents[callType] ?? CallTypeComponents.default;

  return <Component />;
}
