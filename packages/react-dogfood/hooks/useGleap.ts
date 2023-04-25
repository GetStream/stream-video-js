import { useEffect } from 'react';
import Gleap from 'gleap';
import { Call, StreamVideoClient, User } from '@stream-io/video-react-sdk';

export const useGleap = (
  gleapApiKey: string | undefined,
  client: StreamVideoClient,
  user: User,
) => {
  useEffect(() => {
    if (gleapApiKey) {
      Gleap.initialize(gleapApiKey);
      Gleap.identify(user.name || user.id, {
        name: user.name,
      });
    }
  }, [gleapApiKey, user.name, user.id]);

  useEffect(() => {
    if (!gleapApiKey) return;

    Gleap.on('flow-started', () => {
      try {
        const { getCurrentValue, ...state } = client.readOnlyStateStore;
        const data = Object.entries(state).reduce<Record<string, any>>(
          (acc, [key, observable]) => {
            if (!!observable && typeof observable.subscribe === 'function') {
              const value = getCurrentValue<unknown>(observable);
              if (key === 'activeCall$' && value && value instanceof Call) {
                // special handling for the active call
                const call = value;
                const ignoredKeys = [
                  // these two are derived from participants$.
                  // we don't want to send the same data twice.
                  'localParticipant$',
                  'remoteParticipants$',
                ];
                Object.entries(call.state)
                  .filter(([k]) => k.endsWith('$') && !ignoredKeys.includes(k))
                  .forEach(([k, v]) => {
                    if (!!v && typeof v.subscribe === 'function') {
                      acc[`${key}.${k}`] = getCurrentValue(v);
                    } else {
                      acc[`${key}.${k}`] = v;
                    }
                  });
              } else {
                acc[key] = value;
              }
            }
            return acc;
          },
          {},
        );
        console.log('!!State Store', data);
        Gleap.attachCustomData(data);
      } catch (e) {
        console.error(e);
      }
    });
  }, [client.readOnlyStateStore, gleapApiKey]);
};
