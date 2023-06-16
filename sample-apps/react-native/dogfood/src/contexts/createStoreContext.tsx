import React, {
  useRef,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import { MMKV } from 'react-native-mmkv';

const mmkvStorage = new MMKV();

/**
 * Creates a Atomic store context with a provider and hooks to access the store
 * Atomic means that each value in the store updates state separately using useStoreValue hook
 * Extremely minimalistic implementation of Jotai's store context
 * @param initialState - the initial state of the store
 * @param persistStateKeys - the keys of the store that needs to be persisted
 * @returns - {Provider, useStoreValue, useStoreSetState}
 */
export default function createStoreContext<
  StoreType extends Record<string, string | number | boolean>,
>(
  initialState: StoreType,
  // keys of the parts of the store that needs to be persisted
  persistStateKeys: Extract<keyof StoreType, string>[] = [],
) {
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
    const storeRef = useRef<StoreType>(initialState);

    // have we initialized the values from the state keys that were persisted?
    const initializedPersistStateKeys = useRef(false);

    const getSnapshot = useRef(() => {
      // initialize store with persisted values if not already done
      if (!initializedPersistStateKeys.current) {
        const persistedValues: Partial<StoreType> = {};
        persistStateKeys.forEach((key) => {
          const value = mmkvStorage.getString(key);
          if (value) {
            persistedValues[key] = JSON.parse(value);
          }
        });
        storeRef.current = {
          ...storeRef.current,
          ...persistedValues,
        };
        initializedPersistStateKeys.current = true;
      }
      return storeRef.current;
    }).current;

    const subscribersRef = useRef<(() => void)[]>([]);

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

      persistStateKeys.forEach((key) => {
        const value = storeRef.current[key];
        mmkvStorage.set(key, JSON.stringify(value));
      });
    }).current;

    const subscribe = useRef((callback: () => void) => {
      subscribersRef.current.push(callback);
      return () => subscribersRef.current.filter((cb) => cb !== callback);
    }).current;

    return {
      getSnapshot,
      setState,
      subscribe,
    };
  }

  type HookReturnType = ReturnType<typeof useStoreData>;

  const StoreContext = createContext<HookReturnType | null>(null);

  function Provider(props: React.PropsWithChildren<{}>) {
    const value = useStoreData();
    return (
      <StoreContext.Provider value={value}>
        {props.children}
      </StoreContext.Provider>
    );
  }

  function useStoreValue<SelectorOutput extends StoreType[keyof StoreType]>(
    selector: (store: StoreType) => SelectorOutput,
  ): SelectorOutput {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error('Store not found');
    }

    const [state, setState] = useState(selector(store.getSnapshot()));
    useEffect(
      () => store.subscribe(() => setState(selector(store.getSnapshot()))),
      [selector, store],
    );

    return state;
  }

  function useStoreSetState() {
    const store = useContext(StoreContext);
    if (!store) {
      throw new Error('Store not found');
    }
    return store.setState;
  }

  return {
    Provider,
    useStoreValue,
    useStoreSetState,
  };
}
