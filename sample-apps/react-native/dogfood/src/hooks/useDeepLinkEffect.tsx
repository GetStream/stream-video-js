import { useEffect } from 'react';
import { Linking } from 'react-native';
import { BehaviorSubject } from 'rxjs';

export const deeplinkCallId$ = new BehaviorSubject<string | undefined>(
  undefined,
);

export const useDeepLinkEffect = () => {
  useEffect(() => {
    const parseAndSetCallID = (url: string | null) => {
      const matchResponse = url?.match(/.*(join|video\/demos\/join)\/(\w+)\/?/);
      if (matchResponse?.length) {
        console.log('Deeplink Call Id received: ' + matchResponse[2]);
        deeplinkCallId$.next(matchResponse[2]);
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
