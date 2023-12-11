import { useRouter } from 'next/router';
import { JSX, useCallback, useEffect, useState } from 'react';
import Gleap from 'gleap';
import {
  CallingState,
  defaultSortPreset,
  LoadingIndicator,
  noopComparator,
  useCall,
  useCallStateHooks,
  usePersistedDevicePreferences,
} from '@stream-io/video-react-sdk';

import { Lobby } from './Lobby';
import { StreamChat } from 'stream-chat';
import { useKeyboardShortcuts, useWakeLock } from '../hooks';
import { ActiveCall } from './ActiveCall';

const contents = {
  'error-join': {
    heading: 'Failed to join the call',
  },
  'error-leave': {
    heading: 'Error when disconnecting',
  },
};

type MeetingUIProps = {
  chatClient?: StreamChat | null;
  enablePreview?: boolean;
};
export const MeetingUI = ({ chatClient, enablePreview }: MeetingUIProps) => {
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call'
  >('lobby');
  const [lastError, setLastError] = useState<Error>();
  const router = useRouter();
  const activeCall = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callState = useCallCallingState();

  const onJoin = useCallback(
    async (fastJoin: boolean = false) => {
      if (!fastJoin) setShow('loading');
      try {
        const preferredCodec = router.query['video_codec'];
        if (typeof preferredCodec === 'string') {
          activeCall?.camera.setPreferredCodec(preferredCodec);
        }
        await activeCall?.join({ create: true });
        setShow('active-call');
      } catch (e) {
        console.error(e);
        setLastError(e as Error);
        setShow('error-join');
      }
    },
    [activeCall, router],
  );

  const onLeave = useCallback(
    async ({ withFeedback = true }: { withFeedback?: boolean } = {}) => {
      if (!withFeedback) return;
      setShow('loading');
      try {
        await router.push(`/leave/${activeCall?.id}`);
      } catch (e) {
        console.error(e);
        setLastError(e as Error);
        setShow('error-leave');
      }
    },
    [router, activeCall?.id],
  );

  useEffect(() => {
    if (callState === CallingState.LEFT) {
      onLeave({ withFeedback: false }).catch(console.error);
    }
  }, [callState, onLeave]);

  useEffect(() => {
    const handlePageLeave = async () => {
      if (
        activeCall &&
        [CallingState.JOINING, CallingState.JOINED].includes(callState)
      ) {
        await activeCall.leave();
      }
    };
    router.events.on('routeChangeStart', handlePageLeave);
    return () => {
      router.events.off('routeChangeStart', handlePageLeave);
    };
  }, [activeCall, callState, router.events]);

  const isSortingDisabled = router.query['enableSorting'] === 'false';
  useEffect(() => {
    if (!activeCall) return;
    // enable sorting via query param feature flag is provided
    if (isSortingDisabled) {
      activeCall.setSortParticipantsBy(noopComparator());
    } else {
      activeCall.setSortParticipantsBy(defaultSortPreset);
    }
  }, [activeCall, isSortingDisabled]);

  useKeyboardShortcuts();
  useWakeLock();
  usePersistedDevicePreferences('@pronto/device-preferences');

  let ComponentToRender: JSX.Element;
  if (show === 'error-join' || show === 'error-leave') {
    ComponentToRender = (
      <ErrorPage
        heading={contents[show].heading}
        error={lastError}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  } else if (show === 'lobby') {
    ComponentToRender = (
      <Lobby
        onJoin={onJoin}
        callId={activeCall?.id}
        enablePreview={enablePreview}
      />
    );
  } else if (show === 'loading') {
    ComponentToRender = <LoadingScreen />;
  } else if (!activeCall) {
    ComponentToRender = (
      <ErrorPage
        heading={'Lost active call connection'}
        onClickHome={() => router.push(`/`)}
        onClickLobby={() => setShow('lobby')}
      />
    );
  } else {
    ComponentToRender = (
      <ActiveCall
        activeCall={activeCall}
        chatClient={chatClient}
        onLeave={onLeave}
        onJoin={onJoin}
      />
    );
  }

  return ComponentToRender;
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
}: ErrorPageProps) => (
  <div className="rd__error">
    <div className="rd__error__container">
      <h1 className="rd__error__header">{heading}</h1>
      <div className="rd__error__content">
        {error?.stack && (
          <div className="rd__error__message">
            <pre>{error.stack}</pre>
          </div>
        )}
        <p>(see the console for more info)</p>
      </div>

      <div className="rd__error__actions">
        <button
          data-testid="return-home-button"
          className="rd__button rd__button--primary"
          onClick={onClickHome}
        >
          Return home
        </button>

        <button
          data-testid="return-home-button"
          className="rd__button rd__button--secondary"
          onClick={onClickLobby}
        >
          Back to lobby
        </button>

        <button
          data-testid="report-issue-button"
          className="rd__button"
          onClick={() => {
            Gleap.startFeedbackFlow('bugreporting');
          }}
        >
          Report an issue
        </button>
      </div>
    </div>
  </div>
);

export const LoadingScreen = () => {
  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();
  const [message, setMessage] = useState('');
  useEffect(() => {
    if (callingState === CallingState.RECONNECTING) {
      setMessage('Please wait, we are connecting you to the call...');
    } else if (callingState === CallingState.JOINED) {
      setMessage('');
    }
  }, [callingState]);
  return (
    <div className="str-video__call">
      <div className="str-video__call__loading-screen">
        <LoadingIndicator text={message} />
      </div>
    </div>
  );
};
