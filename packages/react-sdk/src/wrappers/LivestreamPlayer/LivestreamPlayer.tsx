import { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Call, CallingState } from '@stream-io/video-client';
import {
  useCall,
  useCallStateHooks,
  useEffectEvent,
  useStreamVideoClient,
} from '@stream-io/video-react-bindings';
import {
  BackstageLayout,
  BackstageLayoutProps,
  LivestreamLayout,
  LivestreamLayoutProps,
  StreamCall,
} from '../../core';
import { Button } from '../../components';
import { useI18n } from '../../i18n';
import { useIsLivestreamPaused } from '../../embedded/hooks/useIsLivestreamPaused';

export type LivestreamPlayerProps = {
  /**
   * The call type. Usually `livestream`.
   */
  callType: string;
  /**
   * The call ID.
   */
  callId: string;
  /**
   * Determines when the viewer joins the call.
   *
   * `"asap"` behavior means joining the call as soon as it is possible
   * (either the `join_ahead_time_seconds` setting allows it, or the user
   * has the capability to join backstage).
   *
   * `"live"` behavior means joining the call when it goes live.
   *
   * @default "asap"
   */
  joinBehavior?: 'asap' | 'live';
  /**
   * The props for the {@link LivestreamLayout} component.
   */
  layoutProps?: LivestreamLayoutProps;
  /**
   * The props for the {@link BackstageLayout} component.
   */
  backstageProps?: BackstageLayoutProps;
  /**
   * Callback to handle errors while fetching or joining livestream.
   * The player also shows an error view with a retry action.
   */
  onError?: (error: any) => void;
};

export const LivestreamPlayer = (
  props: PropsWithChildren<LivestreamPlayerProps>,
) => {
  const { callType, callId, children, ...restProps } = props;
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call>();
  // a record, so a rejection with a falsy value still shows the error view
  const [failure, setFailure] = useState<{ error: unknown }>();
  const [attempt, setAttempt] = useState(0);
  const currentCall = useRef<Call | undefined>(undefined);
  const reportError = (failedCall: Call, e: unknown) => {
    // a request of a call this player no longer shows must not replace it
    if (failedCall !== currentCall.current) return;
    setFailure({ error: e });
    props.onError?.(e);
  };
  const onError = useEffectEvent(reportError);

  useEffect(() => {
    if (!client) return;
    const myCall = client.call(callType, callId);
    currentCall.current = myCall;
    setCall(myCall);
    myCall.get().catch((e) => {
      console.error('Failed to fetch call', e);
      onError(myCall, e);
    });
    return () => {
      currentCall.current = undefined;
      myCall.leave().catch((e) => {
        console.error('Failed to leave call', e);
      });
      setCall(undefined);
      setFailure(undefined);
    };
  }, [callId, callType, client, attempt]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      {failure ? (
        <LivestreamError onRetry={() => setAttempt((a) => a + 1)} />
      ) : (
        <LivestreamCall {...restProps} onError={reportError} />
      )}
      {children}
    </StreamCall>
  );
};

const LivestreamCall = (props: {
  joinBehavior?: 'asap' | 'live';
  layoutProps?: LivestreamLayoutProps;
  backstageProps?: BackstageLayoutProps;
  onError: (call: Call, error: unknown) => void;
}) => {
  const call = useLivestreamCall(props);
  const { useIsCallLive, useCallEndedAt } = useCallStateHooks();
  const isLive = useIsCallLive();
  const endedAt = useCallEndedAt();

  if (!call) return null;

  if (isLive && !endedAt) {
    return <LivestreamLayout {...props.layoutProps} />;
  }

  return <BackstageLayout {...props.backstageProps} />;
};

const LivestreamError = (props: { onRetry: () => void }) => {
  const { t } = useI18n();
  return (
    <div className="str-video__livestream-layout__wrapper">
      <div className="str-video__livestream-layout__backstage">
        <span className="str-video__livestream-layout__error">
          {t(
            'livestream.player.loadFailed.text',
            'The livestream could not be loaded',
          )}
        </span>
        <Button onClick={props.onRetry}>
          {t('common.tryAgain.label', 'Try again')}
        </Button>
      </div>
    </div>
  );
};

const useLivestreamCall = (props: {
  joinBehavior?: 'asap' | 'live';
  onError: (call: Call, error: unknown) => void;
}) => {
  const call = useCall();
  const {
    useCallCallingState,
    useCallEndedAt,
    useIsCallLive,
    useOwnCapabilities,
  } = useCallStateHooks();
  const callingState = useCallCallingState();
  const endedAt = useCallEndedAt();
  const canJoinLive = useIsCallLive();
  const canJoinEarly = useCanJoinEarly();
  const canJoinBackstage =
    useOwnCapabilities()?.includes('join-backstage') ?? false;
  const canJoinAsap = canJoinLive || canJoinEarly || canJoinBackstage;
  const joinBehavior = props.joinBehavior ?? 'asap';
  const isPaused = useIsLivestreamPaused();
  const [rewatchCount, setRewatchCount] = useState(0);
  const canJoin = isPaused
    ? canJoinLive
    : (joinBehavior === 'asap' && canJoinAsap) ||
      (joinBehavior === 'live' && canJoinLive);
  const onError = useEffectEvent(props.onError);

  useEffect(() => {
    if (!call || callingState !== CallingState.LEFT) return;
    if (!isPaused || endedAt) return;
    // Stop Live took this viewer out of the call. Watch the call again and
    // rejoin only once it is live.
    call
      .get()
      .then(() => setRewatchCount((c) => c + 1))
      .catch((e) => {
        console.error('Failed to fetch call', e);
        onError(call, e);
      });
  }, [call, callingState, isPaused, endedAt]);

  useEffect(() => {
    if (call && callingState === CallingState.IDLE && canJoin && !endedAt) {
      call.join().catch((e) => {
        console.error('Failed to join call', e);
        onError(call, e);
      });
    }
    // a failed join returns to IDLE: reacting to `callingState` would retry it
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [call, canJoin, endedAt, rewatchCount]);

  return call;
};

const useCanJoinEarly = () => {
  const { useCallStartsAt, useCallSettings } = useCallStateHooks();
  const startsAt = useCallStartsAt();
  const settings = useCallSettings();
  const joinAheadTimeSeconds = settings?.backstage.join_ahead_time_seconds;
  const [canJoinEarly, setCanJoinEarly] = useState(() =>
    checkCanJoinEarly(startsAt, joinAheadTimeSeconds),
  );

  useEffect(() => {
    if (canJoinEarly) return;
    const handle = setInterval(() => {
      setCanJoinEarly(checkCanJoinEarly(startsAt, joinAheadTimeSeconds));
    }, 1000);

    return () => clearInterval(handle);
  }, [canJoinEarly, startsAt, joinAheadTimeSeconds]);

  return canJoinEarly;
};

const checkCanJoinEarly = (
  startsAt: Date | undefined,
  joinAheadTimeSeconds: number | undefined,
) => {
  if (!startsAt) {
    return false;
  }

  return Date.now() >= +startsAt - (joinAheadTimeSeconds ?? 0) * 1000;
};
