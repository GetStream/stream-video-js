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
   */
  onError?: (error: any) => void;
};

export const LivestreamPlayer = (
  props: PropsWithChildren<LivestreamPlayerProps>,
) => {
  const { callType, callId, children, ...restProps } = props;
  const client = useStreamVideoClient();
  const [call, setCall] = useState<Call>();
  const onError = useEffectEvent(props.onError ?? (() => {}));

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
    };
  }, [callId, callType, client]);

  if (!call) {
    return null;
  }

  return (
    <StreamCall call={call}>
      <LivestreamCall {...restProps} />
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
  const { useIsCallLive } = useCallStateHooks();
  const isLive = useIsCallLive();

  if (!call) return null;

  if (isLive) {
    return <LivestreamLayout {...props.layoutProps} />;
  }

  return <BackstageLayout {...props.backstageProps} />;
};

const useLivestreamCall = (props: {
  joinBehavior?: 'asap' | 'live';
  onError?: (error: any) => void;
}) => {
  const call = useCall();
  const { useIsCallLive, useOwnCapabilities } = useCallStateHooks();
  const canJoinLive = useIsCallLive();
  const canJoinEarly = useCanJoinEarly();
  const canJoinBackstage =
    useOwnCapabilities()?.includes('join-backstage') ?? false;
  const canJoinAsap = canJoinLive || canJoinEarly || canJoinBackstage;
  const joinBehavior = props.joinBehavior ?? 'asap';
  const canJoin =
    (joinBehavior === 'asap' && canJoinAsap) ||
    (joinBehavior === 'live' && canJoinLive);
  const onError = useEffectEvent(props.onError ?? (() => {}));

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
    if (!canJoinEarly) {
      const handle = setInterval(() => {
        setCanJoinEarly(checkCanJoinEarly(startsAt, joinAheadTimeSeconds));
      }, 1000);

      return () => clearInterval(handle);
    }
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
