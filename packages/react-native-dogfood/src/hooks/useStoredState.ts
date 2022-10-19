import {Dispatch, SetStateAction, useEffect, useRef, useState} from 'react';

import AsyncStorage from '@react-native-async-storage/async-storage';

export function useStoredState(
  key: string,
  initialValue: string | (() => string),
): [string, Dispatch<SetStateAction<string>>] {
  const fetchedInitialValue = useRef(false);
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    const getValue = async () => {
      const storedValue = await AsyncStorage.getItem(key);
      if (storedValue) {
        setValue(storedValue);
      }
      fetchedInitialValue.current = true;
    };
    getValue();
  }, [key]);

  useEffect(() => {
    if (value && fetchedInitialValue.current) {
      AsyncStorage.setItem(key, value);
    }
  }, [key, value]);

  return [value, setValue];
}
