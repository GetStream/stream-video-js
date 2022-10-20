import React, { useRef, createContext, useContext } from 'react';

import { useSyncExternalStore } from 'use-sync-external-store';

export default function createStoreContext<StoreType>(initialState: StoreType) {
  type SetStateFuncType = (
    partialStateOrFunc:
      | Partial<StoreType>
      | ((prevState: StoreType) => Partial<StoreType>),
  ) => void;

  // returns unsubscribe function
  type SubscribeFunc = (callback: () => void) => () => void;

  function useStoreData(): {
    getSnapshot: () => StoreType;
    setState: SetStateFuncType;
    subscribe: SubscribeFunc;
  } {
    const storeRef = useRef(initialState);

    const getSnapshot = useRef(() => storeRef.current).current;

    const subscribersRef = useRef(new Set<() => void>());

    const setState = useRef<SetStateFuncType>((partialStateOrFunc) => {
      if (typeof partialStateOrFunc === 'function') {
        const value = partialStateOrFunc(storeRef.current);
        storeRef.current = {
          ...storeRef.current,
          ...value,
        };
      } else {
        storeRef.current = { ...storeRef.current, ...partialStateOrFunc };
      }
      subscribersRef.current.forEach((callback) => callback());
    }).current;

    const subscribe = useRef((callback: () => void) => {
      subscribersRef.current.add(callback);
      return () => subscribersRef.current.delete(callback);
    }).current;

    return {
      getSnapshot,
      setState,
      subscribe,
    };
  }

  type HookReturnType = ReturnType<typeof useStoreData>;

  const StoreContext = createContext<HookReturnType | null>(null);

  function Provider({ children }: { children: React.ReactNode }) {
    return (
      <StoreContext.Provider value={useStoreData()}>
        {children}
      </StoreContext.Provider>
    );
  }

  function useStore<SelectorOutput>(
    selector: (store: StoreType) => SelectorOutput,
  ): [SelectorOutput, HookReturnType['setState']] {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error('Store not found');
    }

    const state = useSyncExternalStore(store.subscribe, () =>
      selector(store.getSnapshot()),
    );

    return [state, store.setState];
  }

  return {
    Provider,
    useStore,
  };
}
