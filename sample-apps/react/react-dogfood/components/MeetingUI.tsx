import {
  CallingState,
  defaultSortPreset,
  LoadingIndicator,
  noopComparator,
  useCall,
  useCallStateHooks,
  useModeration,
} from '@stream-io/video-react-sdk';
import Gleap from 'gleap';
import { useRouter } from 'next/router';
import { JSX, useCallback, useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

import {
  useIsE2EEEnvironment,
  useIsRestrictedEnvironment,
} from '../context/AppEnvironmentContext';
import { useLobbyE2EE } from '../context/LobbyE2EEContext';
import {
  useKeyboardShortcuts,
  usePersistedVideoFilter,
  useWakeLock,
} from '../hooks';
import { ActiveCall } from './ActiveCall';
import { DefaultAppHeader } from './DefaultAppHeader';
import { Feedback } from './Feedback/Feedback';
import { Lobby, UserMode } from './Lobby';
import { getRandomName, sanitizeUserId } from '../lib/names';
import {
  publishRemoteFile,
  RemoteFilePublisher,
  RemoteFilePublisherContext,
} from './RemoteFilePublisher';
import { applyDisplayName } from '../helpers/client';
import { applyQueryConfigParams } from '../lib/queryConfigParams';
import { useAppI18n } from '../hooks/useAppI18n';
import type { LooseTranslateFunction } from '@stream-io/video-react-sdk';

/**
 * The two error headings, previously a `contents` lookup whose value was fed straight to `t()`.
 * Literal calls put the key next to its English; the join failure reuses the SDK's own key rather
 * than minting a duplicate.
 */
const errorHeading = (
  t: LooseTranslateFunction,
  show: 'error-join' | 'error-leave',
) =>
  show === 'error-join'
    ? t('joinError.failedToJoin.title', 'Failed to join the call')
    : t('meeting.error.disconnect.title', 'Error when disconnecting');

type MeetingUIProps = {
  chatClient?: StreamChat | null;
  mode?: UserMode;
};

export const MeetingUI = ({ chatClient, mode }: MeetingUIProps) => {
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call' | 'left'
  >('lobby');
  const [lastError, setLastError] = useState<Error>();
  const router = useRouter();
  const call = useCall();
  const { t } = useAppI18n();
  const { useCallCallingState } = useCallStateHooks();
  const callState = useCallCallingState();
  useModeration();
  const isRestricted = useIsRestrictedEnvironment();
  const allowEncryption = useIsE2EEEnvironment();
  const e2ee = useLobbyE2EE();
  const [remoteFilePublisherAPI, setRemoteFilePublisherAPI] =
    useState<RemoteFilePublisher>();

  const onJoin = useCallback(
    async (options: { fastJoin?: boolean; displayName?: string } = {}) => {
      if (!options.fastJoin) setShow('loading');
      if (!call) throw new Error('No active call found');
      try {
        const { videoFile, videoFileLeaveCallOnEnd } =
          await applyQueryConfigParams(call, router.query, {
            allowEncryption,
            encryptionKey: e2ee?.encryptionKey,
          });
        if (call.state.callingState !== CallingState.JOINED) {
          if (typeof options.displayName === 'string') {
            const name = options.displayName || getRandomName();
            const id = chatClient?.user?.id ?? sanitizeUserId(name);
            const email = chatClient?.user?.email;
            await applyDisplayName(name);
            await chatClient
              ?.partialUpdateUser({ id, set: { name, email } })
              .catch((err) => console.error(`Failed to update user`, err));
          }

          if (videoFile) {
            const api = await publishRemoteFile(call, videoFile, {
              videoFileLeaveCallOnEnd,
            });
            setRemoteFilePublisherAPI(api);
          } else {
            await call.join({ create: !isRestricted });
          }
        }
        setShow('active-call');
      } catch (e) {
        console.error(e);
        setLastError(e as Error);
        setShow('error-join');
      }
    },
    [call, router, chatClient, isRestricted, allowEncryption, e2ee],
  );

  const onLeave = useCallback(
    async ({ withFeedback = true }: { withFeedback?: boolean } = {}) => {
      if (!withFeedback) return;
      try {
        setShow('left');
      } catch (e) {
        console.error(e);
        setLastError(e as Error);
        setShow('error-leave');
      }
    },
    [],
  );

  useEffect(() => {
    if (callState === CallingState.LEFT) {
      onLeave({ withFeedback: false }).catch(console.error);
    }
  }, [callState, onLeave]);

  useEffect(() => {
    if (!call) return;
    return call.on('call.ended', async (e) => {
      if (!e.user || e.user.id === call.currentUserId) return;
      alert(`Call ended for everyone by: ${e.user.name || e.user.id}`);
      if (call.state.callingState !== CallingState.LEFT) {
        await call.leave();
      }
      setShow('left');
    });
  }, [call, router]);

  useEffect(() => {
    const handlePageLeave = async () => {
      if (call) {
        await call.leave();
      }
    };
    router.events.on('routeChangeStart', handlePageLeave);
    return () => {
      router.events.off('routeChangeStart', handlePageLeave);
    };
  }, [call, callState, router.events]);

  const isSortingDisabled = router.query['enableSorting'] === 'false';
  useEffect(() => {
    if (!call) return;
    // enable sorting via query param feature flag is provided
    if (isSortingDisabled) {
      call.setSortParticipantsBy(noopComparator());
    } else {
      call.setSortParticipantsBy(defaultSortPreset);
    }
  }, [call, isSortingDisabled]);

  useKeyboardShortcuts();
  useWakeLock();
  usePersistedVideoFilter('@pronto/video-filter');

  let childrenToRender: JSX.Element;
  if (show === 'error-join' || show === 'error-leave') {
    childrenToRender = (
      <ErrorPage
        heading={errorHeading(t, show)}
        error={lastError}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  } else if (show === 'lobby') {
    childrenToRender = (
      <Lobby onJoin={(displayName) => onJoin({ displayName })} mode={mode} />
    );
  } else if (show === 'loading') {
    childrenToRender = <LoadingScreen />;
  } else if (show === 'left') {
    childrenToRender = (
      <>
        <DefaultAppHeader />
        <div className="rd__leave">
          <div className="rd__leave-content">
            <Feedback inMeeting={false} callId={call?.id} />
          </div>
        </div>
      </>
    );
  } else if (!call) {
    childrenToRender = (
      <ErrorPage
        heading={t(
          'meeting.error.lostConnection.title',
          'Lost active call connection',
        )}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  } else {
    childrenToRender = (
      <RemoteFilePublisherContext.Provider value={remoteFilePublisherAPI}>
        <ActiveCall
          activeCall={call}
          chatClient={chatClient}
          onLeave={onLeave}
          onJoin={() => onJoin()}
        />
      </RemoteFilePublisherContext.Provider>
    );
  }

  return <>{childrenToRender}</>;
};

type ErrorPageProps = {
  heading: string;
  error?: Error;
  onClickHome: () => void;
  onClickLobby: () => void;
};

const ErrorPage = ({
  heading,
  onClickHome,
  onClickLobby,
  error,
}: ErrorPageProps) => {
  const { t } = useAppI18n();
  return (
    <div className="rd__error">
      <div className="rd__error__container">
        <h1 className="rd__error__header">{heading}</h1>
        <div className="rd__error__content">
          {error?.stack && (
            <div className="rd__error__message">
              <pre>{error.stack}</pre>
            </div>
          )}
          <p>
            {t(
              'meeting.error.seeConsole.text',
              '(see the console for more info)',
            )}
          </p>
        </div>

        <div className="rd__error__actions">
          <button
            data-testid="return-home-button"
            className="rd__button rd__button--primary"
            onClick={onClickHome}
          >
            {t('meeting.error.returnHome.label', 'Return home')}
          </button>

          <button
            data-testid="return-home-button"
            className="rd__button rd__button--secondary"
            onClick={onClickLobby}
          >
            {t('meeting.error.backToLobby.label', 'Back to lobby')}
          </button>

          <button
            data-testid="report-issue-button"
            className="rd__button"
            onClick={() => {
              Gleap.startFeedbackFlow('bugreporting');
            }}
          >
            {t('meeting.error.reportIssue.label', 'Report an issue')}
          </button>
        </div>
      </div>
    </div>
  );
};

export const LoadingScreen = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const message =
    callingState === CallingState.RECONNECTING
      ? 'Please wait, we are connecting you to the call...'
      : '';

  return (
    <div className="str-video__call">
      <div className="str-video__call__loading-screen">
        <LoadingIndicator text={message} />
      </div>
    </div>
  );
};
