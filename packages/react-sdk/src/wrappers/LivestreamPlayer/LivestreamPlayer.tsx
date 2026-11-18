import { PropsWithChildren, useEffect, useState } from 'react';
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
  const [error, setError] = useState<unknown>();
  const [attempt, setAttempt] = useState(0);
  const reportError = (e: unknown) => {
    setError(e);
    props.onError?.(e);
  };
  const onError = useEffectEvent(reportError);

  useEffect(() => {
    if (!client) return;
    const myCall = client.call(callType, callId);
    setCall(myCall);
    myCall.get().catch((e) => {
      console.error('Failed to fetch call', e);
      onError(e);
    });
    return () => {
      myCall.leave().catch((e) => {
        console.error('Failed to leave call', e);
      });
      setCall(undefined);
      setError(undefined);
    };
  }, [callId, callType, client, attempt]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      {error ? (
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
  onError?: (error: any) => void;
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
          {t('livestream.player.retry.label', 'Try again')}
        </Button>
      </div>
    </div>
  );
};

const useLivestreamCall = (props: {
  joinBehavior?: 'asap' | 'live';
  onError?: (error: any) => void;
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
  const [liveEnded, setLiveEnded] = useState(false);
  const canJoin = liveEnded
    ? canJoinLive
    : (joinBehavior === 'asap' && canJoinAsap) ||
      (joinBehavior === 'live' && canJoinLive);
  const onError = useEffectEvent(props.onError ?? (() => {}));

  useEffect(() => {
    if (!call || callingState !== CallingState.LEFT) return;
    if (endedAt || canJoinLive) return;
    // Stop Live took this viewer out of the call. Watch the call again and
    // rejoin only at the next Go Live.
    setLiveEnded(true);
    call.get().catch((e) => {
      console.error('Failed to fetch call', e);
      onError(e);
    });
  }, [call, callingState, endedAt, canJoinLive]);

  useEffect(() => {
    if (call && call.state.callingState === CallingState.IDLE && canJoin) {
      call.join().catch((e) => {
        console.error('Failed to join call', e);
        onError(e);
      });
    }
  }, [call, canJoin]);

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
