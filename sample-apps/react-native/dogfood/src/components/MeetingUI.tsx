import React, { useCallback, useEffect, useRef, useState } from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  type Call,
  CallingState,
  useCall,
  useCallStateHooks,
  useI18n,
} from '@stream-io/video-react-native-sdk';
import { MeetingStackParamList, ScreenTypes } from '../../types';
import { LobbyViewComponent } from './LobbyViewComponent';
import { ActiveCall } from './ActiveCall';
import { useAppGlobalStoreSetState } from '../contexts/AppContext';
import { AuthenticationProgress } from './AuthenticatingProgress';
import { CallErrorComponent } from './CallErrorComponent';
import { LayoutProvider } from '../contexts/LayoutContext';
import {
  attachE2EEIfConfigured,
  disposeE2EEManager,
  getE2EESettingsOverride,
} from '../utils/e2ee';
/**
 * One run of this screen's join flow; see {@link MeetingUIFlow}'s `flowRef`.
 *
 * `ended` resolves to whether the teardown actually succeeded - a leave that
 * rejected may have left peers still using the manager, so it is not enough to
 * know that the teardown finished.
 */
type MeetingFlow = { active: boolean; ended?: Promise<boolean> };

/**
 * A stable key per `Call` instance.
 *
 * Keyed on the object rather than the cid: the guest screen rebuilds its client
 * and hands over a different `Call` for the same cid, and that is still a new
 * flow.
 */
let nextFlowKey = 0;
const flowKeys = new WeakMap<Call, number>();
const callFlowKey = (call: Call | undefined): string | number => {
  if (!call) return 'no-call';
  let key = flowKeys.get(call);
  if (key === undefined) {
    key = ++nextFlowKey;
    flowKeys.set(call, key);
  }
  return key;
};

type Props = NativeStackScreenProps<
  MeetingStackParamList,
  'MeetingScreen' | 'GuestMeetingScreen'
> & {
  callId: string;
};

/**
 * Ties this screen's lifetime to the call flow it is showing.
 *
 * Both parents keep one mounted `MeetingUI` across a change of `Call` - the
 * meeting screen memoizes a new one when `callId` changes, the guest screen
 * when its client is rebuilt. Remounting on that change is what keeps the two
 * flows apart: the replacement starts with its own pending-join guard and its
 * own view state, and nothing the abandoned one finishes later can reach it.
 */
export const MeetingUI = (props: Props) => (
  <MeetingUIFlow key={callFlowKey(useCall())} {...props} />
);

const MeetingUIFlow = ({ callId, navigation, route }: Props) => {
  const [show, setShow] = useState<ScreenTypes>('lobby');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const appStoreSetState = useAppGlobalStoreSetState();
  const { t } = useI18n();

  const { useCallCallingState } = useCallStateHooks();
  const callingState = useCallCallingState();

  const call = useCall();

  /**
   * This screen's flow, ended by the cleanup below.
   *
   * A join handler that is still awaiting encryption setup has to be able to
   * tell that its Call has since been left: the SDK cannot see a leave that
   * finished before the public join even started, so cancelling that
   * continuation is the app's job. `ended` is the teardown it has to wait for
   * before releasing anything - a LEFT check is not enough, because an
   * unmounted screen can still be waiting for its own leave to finish.
   */
  const flowRef = useRef<MeetingFlow>({ active: true });

  // Leave the call if the call is not left and the component is unmounted.
  useEffect(() => {
    const flow: MeetingFlow = { active: true };
    flowRef.current = flow;
    return () => {
      flow.active = false;
      const leaveCall = async () => {
        try {
          await call?.leave();
          return true;
        } catch (_e) {
          console.log('Error leaving call:', _e);
          return false;
        }
      };
      if (call?.state.callingState !== CallingState.LEFT) {
        flow.ended = leaveCall().then((tornDown) => {
          // Only a teardown that actually finished releases the manager: a
          // leave that rejected can leave peers still encrypting with it.
          if (tornDown) disposeE2EEManager(call);
          return tornDown;
        });
      } else {
        // already ended, so nothing can still be using it
        disposeE2EEManager(call);
      }
    };
  }, [call]);

  const returnToHomeHandler = () => {
    // `popTo`, not `navigate`: React Navigation 7's navigate pushes a second
    // JoinMeetingScreen and leaves this one mounted underneath it, so its
    // cleanup never runs and Back walks straight into the finished call.
    navigation.popTo('JoinMeetingScreen');
  };

  const backToLobbyHandler = () => {
    setShow('lobby');
  };

  // One Call is one join attempt, so two taps must not each prepare encryption
  // and then race to attach a manager to the same instance.
  const joinInFlight = useRef(false);

  const onJoinCallHandler = useCallback(async () => {
    if (!call || joinInFlight.current) return;
    joinInFlight.current = true;
    const flow = flowRef.current;
    try {
      // call.updatePublishOptions({ preferredCodec: 'h264' });
      // Attach E2EE here rather than on mount: awaiting it immediately before
      // the join leaves no window in which the join could win the race.
      await attachE2EEIfConfigured(call);
      if (!flow.active) {
        // The flow ended while this was preparing, so its cleanup found no
        // manager to dispose. Release the one just attached - but only once
        // that cleanup's teardown has finished, and only if it succeeded, for
        // the same reason it applies there.
        const tornDown = (await flow.ended) ?? true;
        if (tornDown) disposeE2EEManager(call);
        return;
      }
      // The override is repeated here because this join creates the call when
      // the screen's getOrCreate has not landed yet, and a call created without
      // it rejects the E2EE join the attached manager asks for.
      const settings_override = getE2EESettingsOverride();
      await call.join({
        create: true,
        ...(settings_override ? { data: { settings_override } } : {}),
      });
      // The flow can end during the join above - a replacement Call, or this
      // screen going away. Core may still resolve that join rather than reject
      // it, and showing the current call as active, or writing the app store on
      // its behalf, would be reporting a flow that no longer exists.
      if (!flow.active) return;
      appStoreSetState({ chatLabelNoted: false });
      setShow('active-call');
    } catch (error) {
      if (error instanceof Error) {
        console.log('Error joining call:', error);
        setErrorMessage(error.message);
      }
      // The screen has already ended: its cleanup owns the teardown, and there
      // is no error screen left to route to.
      if (!flow.active) return;
      // End the flow rather than leaving a half-joined call sitting behind the
      // error screen. This instance is finished with; another attempt goes
      // through the join screen, which creates a fresh one.
      let tornDown = call.state.callingState === CallingState.LEFT;
      if (!tornDown) {
        tornDown = await call
          .leave()
          .then(() => true)
          .catch((e) => {
            console.log('Error leaving failed call:', e);
            return false;
          });
      }
      // Leaving does not release an app-owned manager, and nothing else will:
      // the unmount cleanup only runs once this route is gone. Skipped when the
      // teardown failed, since live peers may still be using it.
      if (tornDown) disposeE2EEManager(call);
      // The teardown above is awaited, so re-check: the error belongs to this
      // flow, and by now the screen may be showing a different one.
      if (flow.active) setShow('error-join');
    } finally {
      joinInFlight.current = false;
    }
  }, [call, appStoreSetState]);

  const onChatOpenHandler = () => {
    navigation.navigate('ChatScreen', { callId });
  };

  const onHangupCallHandler = async () => {
    setShow('loading');
    try {
      if (callingState !== CallingState.LEFT) {
        await call?.leave();
      }
      navigation.goBack();
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error leaving call:', error);
        setErrorMessage(error.message);
      }
      setShow('error-leave');
    }
  };

  const onCallEnded = () => {
    navigation.goBack();
  };

  if (show === 'error-join' || show === 'error-leave') {
    return (
      <CallErrorComponent
        title={t('Error Joining/Leaving Call')}
        message={errorMessage}
        // Only for a failed leave, where the call may well still be live. A
        // failed join has ended its call, and its lobby would only offer to
        // rejoin an instance that is done with.
        backToLobbyHandler={
          show === 'error-leave' ? backToLobbyHandler : undefined
        }
        returnToHomeHandler={returnToHomeHandler}
      />
    );
  } else if (show === 'loading') {
    return <AuthenticationProgress />;
  } else if (show === 'lobby') {
    return (
      <LobbyViewComponent
        callId={callId}
        onJoinCallHandler={onJoinCallHandler}
        navigation={navigation}
        route={route}
      />
    );
  } else if (!call) {
    return (
      <CallErrorComponent
        title={t('Lost Active Call Connection')}
        message={errorMessage}
        backToLobbyHandler={backToLobbyHandler}
        returnToHomeHandler={returnToHomeHandler}
      />
    );
  } else {
    return (
      <LayoutProvider>
        <ActiveCall
          onCallEnded={onCallEnded}
          onHangupCallHandler={onHangupCallHandler}
          onChatOpenHandler={onChatOpenHandler}
        />
      </LayoutProvider>
    );
  }
};
