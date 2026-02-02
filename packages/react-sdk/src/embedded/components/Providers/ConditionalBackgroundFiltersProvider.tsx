import { PropsWithChildren } from 'react';
import { BackgroundFiltersProvider } from '../../../components';

export interface ConditionalBackgroundFiltersProviderProps {
  enabled?: boolean;
}

export function ConditionalBackgroundFiltersProvider({
  enabled = true,
  children,
}: PropsWithChildren<ConditionalBackgroundFiltersProviderProps>) {
  if (!enabled) {
    return <>{children}</>;
  }

  return <BackgroundFiltersProvider>{children}</BackgroundFiltersProvider>;
}
