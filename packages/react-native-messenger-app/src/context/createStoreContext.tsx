import React, {
  useRef,
  createContext,
  useContext,
  useState,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export default function createStoreContext<PassedStoreType extends object>(
  initialState: PassedStoreType,
  // keys of the parts of the store that needs to be persisted (only string values permitted)
  persistStateKeys: (keyof PassedStoreType)[] = [],
) {
  type SetStateFuncType = (
    partialStateOrFunc:
      | Partial<StoreType>
      | ((prevState: StoreType) => Partial<PassedStoreType>),
  ) => void;

  // returns unsubscribe function
  type SubscribeFunc = (callback: () => void) => () => void;

  type StoreType = PassedStoreType & {isStoreInitialized: boolean};

  function useStoreData(): {
    getSnapshot: () => StoreType;
    setState: SetStateFuncType;
    subscribe: SubscribeFunc;
  } {
    const storeRef = useRef<StoreType>({
      ...initialState,
      isStoreInitialized: false,
    });

    const getSnapshot = useRef(() => storeRef.current).current;

    const subscribersRef = useRef<(() => void)[]>([]);

    const setState = useRef<SetStateFuncType>(partialStateOrFunc => {
      if (typeof partialStateOrFunc === 'function') {
        const value = partialStateOrFunc(storeRef.current);
        storeRef.current = {
          ...storeRef.current,
          ...value,
        };
      } else {
        storeRef.current = {...storeRef.current, ...partialStateOrFunc};
      }
      subscribersRef.current.forEach(callback => callback());

      persistStateKeys.forEach(key => {
        const value = storeRef.current[key];
        if (typeof value === 'string') {
          AsyncStorage.setItem(key as string, value);
        } else {
          console.log("non string values can't be persisted", {key, value});
        }
      });
    }).current;

    useEffect(() => {
      const initPersistedStateValues = async () => {
        if (persistStateKeys.length > 0) {
          try {
            await Promise.all(
              persistStateKeys.map(async key => {
                const storedValue = await AsyncStorage.getItem(key as string);
                if (storedValue) {
                  // @ts-ignore, we only allow string values to be persisted, so this is fine
                  storeRef.current[key] = storedValue;
                }
              }),
            );
          } catch (e) {
            console.log('error while initalising persisted state', e);
          }
          storeRef.current.isStoreInitialized = true;
          subscribersRef.current.forEach(callback => callback());
        }
      };
      initPersistedStateValues();
    }, []);

    const subscribe = useRef((callback: () => void) => {
      subscribersRef.current.push(callback);
      return () => subscribersRef.current.filter(cb => cb !== callback);
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
