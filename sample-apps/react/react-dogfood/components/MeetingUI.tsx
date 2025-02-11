import { useRouter } from 'next/router';
import { JSX, useCallback, useEffect, useState } from 'react';
import Gleap from 'gleap';
import {
  CallingState,
  defaultSortPreset,
  LoadingIndicator,
  noopComparator,
  PreferredCodec,
  useCall,
  useCallStateHooks,
  usePersistedDevicePreferences,
} from '@stream-io/video-react-sdk';

import { Lobby, UserMode } from './Lobby';
import { StreamChat } from 'stream-chat';
import {
  useKeyboardShortcuts,
  usePersistedVideoFilter,
  useWakeLock,
} from '../hooks';
import { ActiveCall } from './ActiveCall';
import { Feedback } from './Feedback/Feedback';
import { DefaultAppHeader } from './DefaultAppHeader';

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
  mode?: UserMode;
};
export const MeetingUI = ({ chatClient, mode }: MeetingUIProps) => {
  const [show, setShow] = useState<
    'lobby' | 'error-join' | 'error-leave' | 'loading' | 'active-call' | 'left'
  >('lobby');
  const [lastError, setLastError] = useState<Error>();
  const router = useRouter();
  const call = useCall();
  const { useCallCallingState } = useCallStateHooks();
  const callState = useCallCallingState();

  const videoCodecOverride = (router.query['video_encoder'] ||
    router.query['video_codec']) as PreferredCodec | undefined;
  const fmtpOverride = router.query['fmtp'] as string | undefined;
  const bitrateOverride = router.query['bitrate'] as string | undefined;
  const videoDecoderOverride = router.query['video_decoder'] as
    | PreferredCodec
    | undefined;
  const videoDecoderFmtpOverride = router.query['video_decoder_fmtp'] as
    | string
    | undefined;
  const maxSimulcastLayers = router.query['max_simulcast_layers'] as
    | string
    | undefined;

  const onJoin = useCallback(
    async ({ fastJoin = false } = {}) => {
      if (!fastJoin) setShow('loading');
      if (!call) throw new Error('No active call found');
      try {
        const preferredBitrate = bitrateOverride
          ? parseInt(bitrateOverride, 10)
          : undefined;
        call.updatePublishOptions({
          preferredCodec: videoCodecOverride,
          fmtpLine: fmtpOverride,
          preferredBitrate,
          subscriberCodec: videoDecoderOverride,
          subscriberFmtpLine: videoDecoderFmtpOverride,
          maxSimulcastLayers: maxSimulcastLayers
            ? parseInt(maxSimulcastLayers, 10)
            : undefined,
        });
        await call.join({ create: true });
        setShow('active-call');
      } catch (e) {
        console.error(e);
        setLastError(e as Error);
        setShow('error-join');
      }
    },
    [
      bitrateOverride,
      call,
      fmtpOverride,
      maxSimulcastLayers,
      videoCodecOverride,
      videoDecoderFmtpOverride,
      videoDecoderOverride,
    ],
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
  usePersistedDevicePreferences('@pronto/device-preferences');
  usePersistedVideoFilter('@pronto/video-filter');

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
    ComponentToRender = <Lobby onJoin={onJoin} mode={mode} />;
  } else if (show === 'loading') {
    ComponentToRender = <LoadingScreen />;
  } else if (show === 'left') {
    ComponentToRender = (
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
        activeCall={call}
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
