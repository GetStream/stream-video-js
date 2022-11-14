import { useEffect } from 'react';
import { Linking } from 'react-native';
import { Subject } from 'rxjs';

export const prontoCallId$ = new Subject<string>();

export const useProntoLink = () => {
  useEffect(() => {
    const parseAndSetCallID = (url: string | null) => {
      const matchResponse = url?.match(/.*join\/(\w+)\/?/);
      if (matchResponse?.length) {
        prontoCallId$.next(matchResponse[1]);
      }
    };
    const { remove } = Linking.addEventListener('url', ({ url }) => {
      parseAndSetCallID(url);
    });
    const configure = async () => {
      const url = await Linking.getInitialURL();
      parseAndSetCallID(url);
    };
    configure();
    return remove;
  }, []);
};
