import { createContext, useContext, useRef, useSyncExternalStore } from 'react';
import { E2EEHarness } from '../harness/E2EEHarness';
import type { Snapshot } from '../harness/snapshot';

const HarnessContext = createContext<E2EEHarness | null>(null);

export const HarnessProvider = HarnessContext.Provider;

/** Create one engine instance, stable for the page lifetime. */
export const useCreateHarness = (callId: string): E2EEHarness => {
  const ref = useRef<E2EEHarness | null>(null);
  if (!ref.current) ref.current = new E2EEHarness({ callId });
  return ref.current;
};

export const useHarnessEngine = (): E2EEHarness => {
  const engine = useContext(HarnessContext);
  if (!engine)
    throw new Error('useHarnessEngine must be used within HarnessProvider');
  return engine;
};

/** Subscribe to the engine snapshot. */
export const useSnapshot = (): Snapshot => {
  const engine = useHarnessEngine();
  return useSyncExternalStore(engine.subscribe, engine.getSnapshot);
};
