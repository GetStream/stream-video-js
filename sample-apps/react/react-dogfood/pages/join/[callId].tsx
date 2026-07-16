import type { INoiseCancellation } from '@stream-io/audio-filters-web';
import {
  BackgroundFiltersProvider,
  Call,
  CallingState,
  CallRequest,
  NoiseCancellationProvider,
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  useCallStateHooks,
  User,
} from '@stream-io/video-react-sdk';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ComponentProps,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TranslationLanguages } from 'stream-chat';
import { MeetingUI } from '../../components';
import { meetingId } from '../../lib/idGenerators';
import {
  LobbyE2EEContext,
  type LobbyE2EEContextValue,
} from '../../context/LobbyE2EEContext';
import { useAppEnvironment } from '../../context/AppEnvironmentContext';
import { useSettings } from '../../context/SettingsContext';
import { getSegmentationModelUrl } from '../../hooks';
import { TourProvider } from '../../context/TourContext';
import { getClient } from '../../helpers/client';
import { useCreateStreamChatClient } from '../../hooks';
import { useGleap } from '../../hooks/useGleap';
import {
  getServerSideCredentialsPropsWithOptions,
  ServerSideCredentialsProps,
} from '../../lib/getServerSideCredentialsProps';
import appTranslations from '../../translations';
import { RingingCallNotification } from '../../components/Ringing/RingingCallNotification';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const HeadComponent = ({ callId }: { callId: string }) => {
  const { useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();

  return (
    <Head>
      <title>Stream Calls: {customData.name || callId}</title>
      <meta name="viewport" content="initial-scale=1.0, width=device-width" />
    </Head>
  );
};

/**
 * The call-scoped subtree: the noise-cancellation instance and every provider
 * that binds to a specific call live here. It is rendered with `key={call.cid}`
 * so that swapping to a different call (e.g. enabling E2EE navigates to a fresh
 * encrypted call id) fully remounts it - a clean, page-load-like init for the
 * new call. Keeping these providers mounted across an in-place call swap instead
 * races the noise-cancellation lifecycle against the not-yet-ready new call
 * ("Noise cancellation is not available").
 */
const CallScope = ({
  call,
  chatClient,
  useLegacyFilters,
  segmentationModel,
}: {
  call: Call;
  chatClient: ComponentProps<typeof MeetingUI>['chatClient'];
  useLegacyFilters: boolean;
  segmentationModel: Parameters<typeof getSegmentationModelUrl>[0];
}) => {
  const [noiseCancellation, setNoiseCancellation] =
    useState<INoiseCancellation>();
  const ncLoader = useRef<Promise<void>>(undefined);
  useEffect(() => {
    const load = (ncLoader.current || Promise.resolve())
      .then(() => import('@stream-io/audio-filters-web'))
      .then(({ NoiseCancellation }) => {
        setNoiseCancellation(new NoiseCancellation());
      });
    return () => {
      ncLoader.current = load.then(() => setNoiseCancellation(undefined));
    };
  }, []);

  return (
    <StreamCall call={call}>
      <HeadComponent callId={call.id} />

      <TourProvider>
        <BackgroundFiltersProvider
          forceSafariSupport
          useLegacyFilter={useLegacyFilters}
          modelFilePath={getSegmentationModelUrl(segmentationModel)}
          backgroundImages={[
            `${basePath}/backgrounds/amsterdam-1.jpg`,
            `${basePath}/backgrounds/amsterdam-2.jpg`,
            `${basePath}/backgrounds/boulder-1.jpg`,
            `${basePath}/backgrounds/boulder-2.jpg`,
            `${basePath}/backgrounds/gradient-1.jpg`,
            `${basePath}/backgrounds/gradient-2.jpg`,
            `${basePath}/backgrounds/gradient-3.jpg`,
          ]}
        >
          {noiseCancellation && (
            <NoiseCancellationProvider noiseCancellation={noiseCancellation}>
              <RingingCallNotification />
              <MeetingUI chatClient={chatClient} />
            </NoiseCancellationProvider>
          )}
        </BackgroundFiltersProvider>
      </TourProvider>
    </StreamCall>
  );
};

const CallRoom = (props: ServerSideCredentialsProps) => {
  const router = useRouter();
  const {
    settings: { language, fallbackLanguage, segmentationModel },
  } = useSettings();
  const callId = router.query['callId'] as string;
  const callType = (router.query['type'] as string) || 'default';
  const useLocalCoordinator = router.query['use_local_coordinator'] === 'true';
  const coordinatorUrl = useLocalCoordinator
    ? 'http://localhost:3030/video'
    : (router.query['coordinator_url'] as string | undefined);
  const useLegacyFilters = router.query['useLegacyFilters'] === 'true';

  const { apiKey, userToken, user, gleapApiKey } = props;

  const environment = useAppEnvironment();

  // E2EE is limited to the `pronto` environment for now. When a shared key is
  // present in the URL, the initial call must be *created* end-to-end encrypted -
  // otherwise the backend rejects the (e2ee: true) join. See lib/queryConfigParams.
  const initialEncryptionKey = router.query['encryption_key'] as
    | string
    | undefined;
  const e2eeEnabled = environment === 'pronto' && !!initialEncryptionKey;

  const [client, setClient] = useState<StreamVideoClient>();
  useEffect(() => {
    const _client = getClient(
      { apiKey, user, userToken, coordinatorUrl },
      environment,
    );
    setClient(_client);
    window.client = _client;

    return () => {
      setClient(undefined);
      window.client = undefined;
    };
  }, [apiKey, coordinatorUrl, environment, user, userToken]);

  const chatClient = useCreateStreamChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: {
      id: '!anon',
      ...(user as Omit<User, 'type' | 'push_notifications'>),
      language: user.language as TranslationLanguages | undefined,
    },
  });

  const [call, setCall] = useState<Call>();
  const [callError, setCallError] = useState<string | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | undefined>(
    e2eeEnabled ? initialEncryptionKey : undefined,
  );
  const activeCallRef = useRef<Call | undefined>(undefined);

  // Point the provider tree at `next`, leaving the previous (never-joined) call
  // behind. Swapping the call object in place avoids a navigation/remount.
  const swapCall = useCallback((next: Call) => {
    const prev = activeCallRef.current;
    if (
      prev &&
      prev !== next &&
      prev.state.callingState !== CallingState.LEFT
    ) {
      prev.leave().catch((e) => console.error('Failed to leave call', e));
    }
    activeCallRef.current = next;
    window.call = next;
    setCall(next);
  }, []);

  useEffect(() => {
    if (!client) return;
    const initial = client.call(callType, callId, { reuseInstance: true });
    swapCall(initial);
    // "restricted" is a special call type that only allows the `call_member`
    // role to join the call.
    const data: CallRequest =
      callType === 'restricted'
        ? { members: [{ user_id: user.id || '!anon', role: 'call_member' }] }
        : {};
    if (e2eeEnabled) {
      data.settings_override = { encryption: { enabled: true } };
    }
    initial.getOrCreate({ data }).catch((err) => {
      console.error(`Failed to get or create call`, err);
      setCallError(
        err instanceof Error ? err.message : 'Could not get or create call',
      );
    });

    return () => {
      const active = activeCallRef.current;
      if (active && active.state.callingState !== CallingState.LEFT) {
        active.leave().catch((e) => console.error('Failed to leave call', e));
      }
      activeCallRef.current = undefined;
      window.call = undefined;
      setCall(undefined);
    };
  }, [callId, callType, client, e2eeEnabled, user.id, swapCall]);

  // Rewrite the URL (call id + shared key) without a Next.js navigation, so the
  // invite link stays shareable and the router's leave-on-route-change handler
  // does not fire.
  const replaceUrl = useCallback((id: string, key: string | undefined) => {
    const url = new URL(window.location.href);
    url.pathname = url.pathname.replace(/[^/]+$/, id);
    if (key) url.searchParams.set('encryption_key', key);
    else url.searchParams.delete('encryption_key');
    window.history.replaceState(window.history.state, '', url.toString());
  }, []);

  // Encryption is fixed at creation, so toggling swaps in a freshly created call
  // of the same type. getOrCreate is awaited so the call is fully ready before it
  // is handed to the providers (no capability race on noise cancellation).
  const switchEncryption = useCallback(
    async (enabled: boolean, key?: string) => {
      if (!client) return;
      const next = client.call(callType, meetingId());
      await next.getOrCreate({
        data: enabled
          ? { settings_override: { encryption: { enabled: true } } }
          : {},
      });
      swapCall(next);
      setEncryptionKey(enabled ? key : undefined);
      replaceUrl(next.id, enabled ? key : undefined);
    },
    [client, callType, swapCall, replaceUrl],
  );

  const e2eeControls = useMemo<LobbyE2EEContextValue>(
    () => ({
      encryptionKey,
      enableEncryption: (key: string) => switchEncryption(true, key),
      disableEncryption: () => switchEncryption(false),
      updateEncryptionKey: (key: string) => {
        setEncryptionKey(key);
        const id = activeCallRef.current?.id;
        if (id) replaceUrl(id, key);
      },
    }),
    [encryptionKey, switchEncryption, replaceUrl],
  );

  // apple-itunes-app meta-tag is used to open the app from the browser
  // we need to update the app-argument to the current URL so that the app
  // can open the correct call
  useEffect(() => {
    const appleItunesAppMeta = document
      .getElementsByTagName('meta')
      .namedItem('apple-itunes-app');
    if (appleItunesAppMeta) {
      appleItunesAppMeta.setAttribute(
        'content',
        `app-id=1644313060, app-argument=${window.location.href
          .replace('http://', 'streamvideo://')
          .replace('https://', 'streamvideo://')}`,
      );
    }
  }, []);

  useGleap(gleapApiKey, client, call, user);

  if (!client || !call) return null;

  if (callError) {
    return (
      <div className="str-video__call">
        <div className="str-video__call__loading-screen">
          <div className="rd__call-not-found">
            Call not found.
            <br />
            It may have already ended, or the call ID is incorrect.
            <button
              className="rd__button rd__button--secondary rd__button--large rd__call-not-found-button"
              onClick={() => {
                router.push('/');
              }}
            >
              Join another call
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <StreamVideo
        client={client}
        language={language}
        fallbackLanguage={fallbackLanguage}
        translationsOverrides={appTranslations}
      >
        <LobbyE2EEContext.Provider value={e2eeControls}>
          <CallScope
            call={call}
            chatClient={chatClient}
            useLegacyFilters={useLegacyFilters}
            segmentationModel={segmentationModel}
          />
        </LobbyE2EEContext.Provider>
      </StreamVideo>
    </>
  );
};

export default CallRoom;

export const getServerSideProps = getServerSideCredentialsPropsWithOptions({
  signInAutomatically: true,
});
