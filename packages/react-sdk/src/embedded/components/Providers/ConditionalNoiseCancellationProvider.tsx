import { PropsWithChildren } from 'react';
import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import { NoiseCancellationProvider } from '../../../components';

export interface ConditionalNoiseCancellationProviderProps {
  enabled?: boolean;
  noiseCancellation?: INoiseCancellation;
}

export function ConditionalNoiseCancellationProvider({
  enabled = true,
  noiseCancellation,
  children,
}: PropsWithChildren<ConditionalNoiseCancellationProviderProps>) {
  if (!enabled || !noiseCancellation) {
    return <>{children}</>;
  }

  return (
    <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
      {children}
    </NoiseCancellationProvider>
  );
}
