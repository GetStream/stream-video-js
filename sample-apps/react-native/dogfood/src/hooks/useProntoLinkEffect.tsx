import { useEffect } from 'react';
import { Linking } from 'react-native';
import { BehaviorSubject } from 'rxjs';

export const prontoCallId$ = new BehaviorSubject<string | undefined>(undefined);

export const useProntoLinkEffect = () => {
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
