import { useEffect } from 'react';
import { Alert, Linking } from 'react-native';
import { BehaviorSubject } from 'rxjs';
import {
  CallingState,
  type StreamVideoClient,
} from '@stream-io/video-react-native-sdk';
import {
  useAppGlobalStoreSetState,
  useAppGlobalStoreValue,
} from '../contexts/AppContext';
import { navigationRef } from '../utils/staticNavigationUtils';

export const deeplinkCallId$ = new BehaviorSubject<string | undefined>(
  undefined,
);

const linkEnvironments = new Map<string, AppEnvironment>([
  ['getstream.io', 'demo'],
  ['pronto.getstream.io', 'pronto'],
  ['pronto-staging.getstream.io', 'pronto-staging'],
]);

// Keep a cold-start link until login has made the video client available.
const encryptedDeepLink$ = new BehaviorSubject<
  | { callId: string; encryptionKey: string; environment: AppEnvironment }
  | undefined
>(undefined);

export const useDeepLinkEffect = () => {
  useEffect(() => {
    const parseAndSetCallID = (url: string | null) => {
      if (!url) return;
      let link: URL;
      try {
        link = new URL(url);
      } catch {
        return;
      }
      const callId = link.pathname.match(
        /^\/(?:join|video\/demos\/join)\/([A-Za-z0-9_-]+)\/?$/,
      )?.[1];
      if (!callId) return;
      const environment = linkEnvironments.get(link.hostname);
      const encryptionKey = link.searchParams.get('encryption_key')?.trim();
      if (encryptionKey !== undefined && (!environment || !encryptionKey)) {
        return;
      }
      encryptedDeepLink$.next(
        encryptionKey && environment
          ? { callId, encryptionKey, environment }
          : undefined,
      );
      if (!encryptionKey) deeplinkCallId$.next(callId);
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

export const useEncryptedDeepLinkEffect = (
  client: StreamVideoClient | undefined,
) => {
  const environment = useAppGlobalStoreValue((store) => store.appEnvironment);
  const setState = useAppGlobalStoreSetState();

  useEffect(() => {
    if (!client) return;
    const subscription = encryptedDeepLink$.subscribe((link) => {
      if (!link) return;
      encryptedDeepLink$.next(undefined);
      if (environment !== link.environment) {
        Alert.alert(`Switch to ${link.environment} to open this link`);
        return;
      }
      // Include meeting preparation and guest meetings using a separate client.
      const hasActiveCall =
        ['MeetingScreen', 'GuestMeetingScreen'].includes(
          navigationRef.getCurrentRoute()?.name ?? '',
        ) ||
        client.state.calls.some(
          (call) =>
            ![
              CallingState.UNKNOWN,
              CallingState.IDLE,
              CallingState.LEFT,
            ].includes(call.state.callingState),
        );
      if (hasActiveCall) {
        Alert.alert('Leave the current call before opening this link');
        return;
      }
      setState({ e2eeKeyInput: link.encryptionKey });
      deeplinkCallId$.next(link.callId);
    });
    return () => subscription.unsubscribe();
  }, [client, environment, setState]);
};
