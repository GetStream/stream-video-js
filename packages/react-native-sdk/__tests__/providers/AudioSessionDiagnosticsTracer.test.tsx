import React from 'react';
import { act, render } from '@testing-library/react-native';
import { AppState, Platform } from 'react-native';
import { BehaviorSubject } from 'rxjs';
import { CallingState } from '@stream-io/video-client';
import {
  AudioDeviceModule,
  audioDeviceModuleEvents,
} from '@stream-io/react-native-webrtc';
import { callManager } from '../../src/modules/call-manager';
import { getCallingxLibIfAvailable } from '../../src/utils/push/libs/callingx';
import { AudioSessionDiagnosticsTracer } from '../../src/providers/StreamCall/AudioSessionDiagnosticsTracer';

const mockUseCall = jest.fn();
jest.mock('@stream-io/video-react-bindings', () => {
  const { useEffect, useState } = require('react');
  const useValue = <T,>(subject: {
    getValue: () => T;
    subscribe: (cb: (v: T) => void) => { unsubscribe: () => void };
  }) => {
    const [value, setValue] = useState(subject.getValue());
    useEffect(() => {
      const s = subject.subscribe(setValue);
      return () => s.unsubscribe();
    }, [subject]);
    return value;
  };
  return {
    useCall: () => mockUseCall(),
    useCallStateHooks: () => ({
      useCallCallingState: () => useValue(mockUseCall().state.callingState$),
      useMicrophoneState: () => ({
        status: useValue(mockUseCall().microphone.state.status$),
      }),
    }),
  };
});
const mockLogger = { warn: jest.fn(), info: jest.fn(), debug: jest.fn() };
jest.mock('@stream-io/video-client', () => ({
  ...jest.requireActual('@stream-io/video-client'),
  videoLoggerSystem: { getLogger: () => mockLogger },
}));
jest.mock('@stream-io/react-native-webrtc', () => ({
  AudioDeviceModule: {
    getEngineState: jest.fn(),
    recoverEngineIfNeeded: jest.fn(),
  },
  audioDeviceModuleEvents: { addEngineErrorListener: jest.fn() },
}));
jest.mock('../../src/modules/call-manager', () => ({
  callManager: {
    audioDevices: { addChangeListener: jest.fn() },
    ios: {
      getAudioSessionState: jest.fn(),
      reactivateAudioSession: jest.fn(),
      addAudioSessionDiagnosticListener: jest.fn(),
      addAudioInterruptionListener: jest.fn(),
    },
  },
}));
jest.mock('../../src/utils/push/libs/callingx', () => ({
  getCallingxLibIfAvailable: jest.fn(),
}));

const adm = AudioDeviceModule as unknown as {
  getEngineState: jest.Mock;
  recoverEngineIfNeeded: jest.Mock;
};
const admEvents = audioDeviceModuleEvents as unknown as {
  addEngineErrorListener: jest.Mock;
};
const iosCallManager = callManager.ios as unknown as {
  getAudioSessionState: jest.Mock;
  reactivateAudioSession: jest.Mock;
  addAudioSessionDiagnosticListener: jest.Mock;
  addAudioInterruptionListener: jest.Mock;
};
const audioDevices = callManager.audioDevices as unknown as {
  addChangeListener: jest.Mock;
};
const sessionState = {
  category: 'PlayAndRecord',
  route: 'MicrophoneBuiltIn>Speaker',
  micPermission: 'undetermined',
};
const healthyEngine = {
  isPlaying: true,
  isRecording: true,
  isEngineRunning: true,
  isMicrophoneMuted: false,
  isRecordingAlwaysPreparedMode: false,
  isInputAvailable: true,
  isOutputAvailable: true,
  isVoiceProcessingEnabled: true,
  sessionCategory: 'AVAudioSessionCategoryPlayAndRecord',
  sessionActive: true,
};
const deadEngine = { ...healthyEngine, isEngineRunning: false };

const makeCall = () => {
  const callingState$ = new BehaviorSubject(CallingState.JOINING);
  const status$ = new BehaviorSubject<string | undefined>('enabled');
  return {
    callingState$,
    status$,
    tracer: { trace: jest.fn() },
    rejoinForAudioEngineRecovery: jest.fn().mockReturnValue(true),
    state: {
      callingState$,
      get callingState() {
        return callingState$.getValue();
      },
    },
    microphone: {
      state: {
        status$,
        get status() {
          return status$.getValue();
        },
      },
    },
  };
};
type TestCall = ReturnType<typeof makeCall>;

const tracesOf = (call: TestCall, tag: string) =>
  call.tracer.trace.mock.calls
    .filter(([t]) => t === tag)
    .map(([, payload]) => payload);
const recordingStateTraces = (call: TestCall) =>
  tracesOf(call, 'ios.audioRecording.state');
const recoveryTraces = (call: TestCall) =>
  tracesOf(call, 'ios.audioEngine.recovery');

/** Advances fake timers and flushes the resulting promise chains. */
const advance = async (ms: number) => {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
};

/** Emits the calling states of a reconnect, as `Call.performJoin` does. */
const reconnect = (call: TestCall) => {
  [
    CallingState.RECONNECTING,
    CallingState.JOINING,
    CallingState.JOINED,
  ].forEach((state) => {
    act(() => {
      call.callingState$.next(state);
    });
  });
};

/** Renders the tracer for a call that is already JOINED. */
const renderJoined = async () => {
  const call = makeCall();
  call.callingState$.next(CallingState.JOINED);
  mockUseCall.mockReturnValue(call);
  render(<AudioSessionDiagnosticsTracer />);
  await advance(3000);
  return call;
};

describe('AudioSessionDiagnosticsTracer', () => {
  let diagnosticListener: (event: unknown) => void;
  let interruptionListener: (event: unknown) => void;
  let routeListener: () => void;
  let appStateListener: (state: string) => void;
  let engineErrorListener: (event: unknown) => void;
  let removeEngineErrorListener: jest.Mock;
  let checkPermission: jest.Mock;
  const originalAppState = AppState.currentState;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    AppState.currentState = 'active';
    checkPermission = jest.fn().mockResolvedValue(true);
    (globalThis as any).streamRNVideoSDK = {
      permissions: { check: checkPermission },
    };
    (getCallingxLibIfAvailable as jest.Mock).mockReturnValue(undefined);
    iosCallManager.getAudioSessionState.mockReturnValue(sessionState);
    iosCallManager.reactivateAudioSession.mockResolvedValue(true);
    iosCallManager.addAudioSessionDiagnosticListener.mockImplementation(
      (listener) => {
        diagnosticListener = listener;
        return jest.fn();
      },
    );
    iosCallManager.addAudioInterruptionListener.mockImplementation(
      (listener) => {
        interruptionListener = listener;
        return jest.fn();
      },
    );
    removeEngineErrorListener = jest.fn();
    admEvents.addEngineErrorListener.mockImplementation((listener) => {
      engineErrorListener = listener;
      return { remove: removeEngineErrorListener };
    });
    audioDevices.addChangeListener.mockImplementation((listener) => {
      routeListener = listener;
      return jest.fn();
    });
    jest.spyOn(AppState, 'addEventListener').mockImplementation(((
      _: string,
      listener: (state: string) => void,
    ) => {
      appStateListener = listener;
      return { remove: jest.fn() };
    }) as unknown as typeof AppState.addEventListener);
    adm.getEngineState.mockResolvedValue(healthyEngine);
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'failed',
      before: deadEngine,
      after: deadEngine,
      codes: { startRecording: -1 },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    AppState.currentState = originalAppState;
    delete (globalThis as any).streamRNVideoSDK;
  });

  it('traces a minimal healthy sample after joining, without recovery', async () => {
    const call = makeCall();
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    await advance(3000);

    expect(recordingStateTraces(call)).toEqual([
      {
        trigger: 'joined',
        wantsRecording: true,
        isRecording: true,
        isPlaying: true,
        isEngineRunning: true,
        isMicrophoneMuted: false,
      },
    ]);
    expect(iosCallManager.getAudioSessionState).not.toHaveBeenCalled();

    // healthy: no re-check, no recovery
    await advance(20000);
    expect(recordingStateTraces(call)).toHaveLength(1);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
  });

  it('does nothing without a live call factory', async () => {
    adm.getEngineState.mockResolvedValue(null);
    const call = await renderJoined();

    expect(call.tracer.trace).not.toHaveBeenCalled();
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
  });

  it('does not re-trace an unchanged healthy state', async () => {
    const call = await renderJoined();

    interruptionListener({ source: 'callmanager', phase: 'ended' });
    await advance(1000);
    expect(recordingStateTraces(call)).toHaveLength(1);

    adm.getEngineState.mockResolvedValue({
      ...healthyEngine,
      isPlaying: false,
    });
    interruptionListener({ source: 'callmanager', phase: 'ended' });
    await advance(1000);
    expect(recordingStateTraces(call)).toHaveLength(2);
  });

  it('recovers a dead engine and traces the unhealthy state and the result', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'recovered',
      before: deadEngine,
      after: healthyEngine,
      codes: { startRecording: 0 },
    });
    const call = await renderJoined();

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledWith(true);
    expect(recordingStateTraces(call)).toEqual([
      {
        trigger: 'joined',
        wantsRecording: true,
        ...deadEngine,
        session: sessionState,
      },
    ]);
    expect(recoveryTraces(call)).toEqual([
      { trigger: 'joined', result: 'recovered', attempt: 1 },
    ]);

    // recovered: no re-check
    await advance(30000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);
  });

  it('checks the playout when the mic is not wanted', async () => {
    adm.getEngineState.mockResolvedValue({
      ...deadEngine,
      isRecording: false,
    });
    const call = makeCall();
    call.callingState$.next(CallingState.JOINED);
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    act(() => {
      call.status$.next('disabled');
    });

    appStateListener('active');
    await advance(1000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledWith(false);
    expect(checkPermission).not.toHaveBeenCalled();
  });

  it('adds the failure details to failed recovery traces', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    const recentErrors = Array.from({ length: 12 }, (_, i) => ({
      message: `${i}`.padEnd(300, 'x'),
      severity: 'error',
      timestamp: i,
    }));
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'outputOnly',
      reason: undefined,
      before: deadEngine,
      after: { ...deadEngine, isEngineRunning: true },
      codes: { startRecording: -1 },
      recentErrors,
    });
    const call = await renderJoined();

    const [trace] = recoveryTraces(call);
    expect(trace).toEqual({
      trigger: 'joined',
      result: 'outputOnly',
      attempt: 1,
      before: deadEngine,
      after: { ...deadEngine, isEngineRunning: true },
      codes: { startRecording: -1 },
      recentErrors: recentErrors.slice(2).map((e) => ({
        ...e,
        message: e.message.slice(0, 200),
      })),
    });
  });

  it('re-checks a failed recovery every 3 s, at most 3 times per episode', async () => {
    // backgrounded: no rejoin (it would start a new episode)
    AppState.currentState = 'background';
    adm.getEngineState.mockResolvedValue(deadEngine);
    const call = await renderJoined();
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);

    await advance(2999);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(2);
    await advance(3000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);

    // episode over (rejoin not allowed): no self-loop
    await advance(30000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);

    // the next trigger starts a new episode
    appStateListener('active');
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(4);
    expect(recoveryTraces(call).map((t) => [t.trigger, t.attempt])).toEqual([
      ['joined', 1],
      ['recheck', 2],
      ['recheck', 3],
      ['appActive', 1],
    ]);
  });

  it('rejoins once per call when a whole episode fails', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    const call = await renderJoined();
    await advance(6000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(call.rejoinForAudioEngineRecovery).toHaveBeenCalledTimes(1);
    expect(tracesOf(call, 'ios.audioEngine.rejoin')).toEqual([
      { trigger: 'budgetExhausted', lastResult: 'failed', started: true },
    ]);

    // the rejoin brings the call back to JOINED: one more episode, no rejoin
    reconnect(call);
    await advance(3000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(4);
    await advance(30000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(6);
    expect(recoveryTraces(call).map((t) => [t.trigger, t.attempt])).toEqual([
      ['joined', 1],
      ['recheck', 2],
      ['recheck', 3],
      ['reconnected', 1],
      ['recheck', 2],
      ['recheck', 3],
    ]);
    expect(call.rejoinForAudioEngineRecovery).toHaveBeenCalledTimes(1);
  });

  it('starts a new episode on the next trigger when the rejoin did not start', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    const call = makeCall();
    call.rejoinForAudioEngineRecovery.mockReturnValueOnce(false);
    call.callingState$.next(CallingState.JOINED);
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    await advance(3000 + 6000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(call.rejoinForAudioEngineRecovery).toHaveBeenCalledTimes(1);
    expect(tracesOf(call, 'ios.audioEngine.rejoin')).toEqual([
      { trigger: 'budgetExhausted', lastResult: 'failed', started: false },
    ]);

    // episode over: no retry loop
    await advance(30000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(call.rejoinForAudioEngineRecovery).toHaveBeenCalledTimes(1);

    // the next trigger starts a new episode without a healthy sample
    appStateListener('active');
    await advance(1000 + 6000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(6);
    expect(call.rejoinForAudioEngineRecovery).toHaveBeenCalledTimes(2);
    expect(tracesOf(call, 'ios.audioEngine.rejoin')).toEqual([
      { trigger: 'budgetExhausted', lastResult: 'failed', started: false },
      { trigger: 'budgetExhausted', lastResult: 'failed', started: true },
    ]);
  });

  it('starts a new episode on the next trigger when the rejoin was not allowed', async () => {
    AppState.currentState = 'background';
    adm.getEngineState.mockResolvedValue(deadEngine);
    const call = await renderJoined();
    await advance(6000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(call.rejoinForAudioEngineRecovery).not.toHaveBeenCalled();

    // back in the foreground: recovery runs again and may rejoin now
    AppState.currentState = 'active';
    appStateListener('active');
    // the first attempt is deferred to keep it 3 s after the last one
    await advance(1000 + 2000 + 6000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(6);
    expect(call.rejoinForAudioEngineRecovery).toHaveBeenCalledTimes(1);
    expect(tracesOf(call, 'ios.audioEngine.rejoin')).toEqual([
      { trigger: 'budgetExhausted', lastResult: 'failed', started: true },
    ]);
  });

  it('does not rejoin when the app is in the background', async () => {
    AppState.currentState = 'background';
    adm.getEngineState.mockResolvedValue(deadEngine);
    const call = await renderJoined();
    await advance(6000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(call.rejoinForAudioEngineRecovery).not.toHaveBeenCalled();
    expect(tracesOf(call, 'ios.audioEngine.rejoin')).toEqual([]);
  });

  it('does not rejoin when the mic is off', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    const call = makeCall();
    call.status$.next('disabled');
    call.callingState$.next(CallingState.JOINED);
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    appStateListener('active');
    await advance(1000 + 6000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(adm.recoverEngineIfNeeded).toHaveBeenLastCalledWith(false);
    expect(call.rejoinForAudioEngineRecovery).not.toHaveBeenCalled();
  });

  it('does not rejoin when the call is no longer JOINED', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    const call = makeCall();
    call.callingState$.next(CallingState.JOINED);
    mockUseCall.mockReturnValue(call);
    // the call starts reconnecting during the last attempt
    adm.recoverEngineIfNeeded.mockImplementation(async () => {
      if (adm.recoverEngineIfNeeded.mock.calls.length === 3) {
        call.callingState$.next(CallingState.RECONNECTING);
      }
      return { result: 'failed', before: deadEngine, codes: {} };
    });
    render(<AudioSessionDiagnosticsTracer />);
    await advance(3000 + 6000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(call.rejoinForAudioEngineRecovery).not.toHaveBeenCalled();
  });

  it('caps the recovery attempts per call', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    await renderJoined();
    await advance(6000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);

    // a healthy sample starts a new episode
    adm.getEngineState.mockResolvedValue(healthyEngine);
    appStateListener('active');
    await advance(1000);
    adm.getEngineState.mockResolvedValue(deadEngine);
    appStateListener('active');
    // 2 s after the last attempt: deferred to keep the attempts 3 s apart
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(4);
    await advance(6000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(6);

    adm.getEngineState.mockResolvedValue(healthyEngine);
    appStateListener('active');
    await advance(1000);
    adm.getEngineState.mockResolvedValue(deadEngine);
    appStateListener('active');
    await advance(10000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(6);
  });

  it('skips the recovery when the mic is disabled after the sample', async () => {
    const call = makeCall();
    call.callingState$.next(CallingState.JOINED);
    mockUseCall.mockReturnValue(call);
    adm.getEngineState.mockImplementation(async () => {
      if (adm.getEngineState.mock.calls.length === 1) {
        call.status$.next('disabled');
      }
      return deadEngine;
    });
    render(<AudioSessionDiagnosticsTracer />);
    await advance(3000);

    expect(adm.getEngineState).toHaveBeenCalledTimes(1);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
    expect(recoveryTraces(call)).toEqual([]);

    // no budget used: the next mic enable gets a full episode
    act(() => {
      call.status$.next('enabled');
    });
    await advance(3000 + 6000);
    expect(recoveryTraces(call).map((t) => [t.trigger, t.attempt])).toEqual([
      ['micEnabled', 1],
      ['recheck', 2],
      ['recheck', 3],
    ]);
  });

  it.each([
    [
      'the call is no longer JOINED',
      (call: TestCall) => call.callingState$.next(CallingState.RECONNECTING),
    ],
    [
      'the audio is interrupted',
      () => interruptionListener({ source: 'callmanager', phase: 'began' }),
    ],
  ])(
    'skips the recovery when %s after the sample',
    async (_, change: (call: TestCall) => void) => {
      const call = makeCall();
      call.callingState$.next(CallingState.JOINED);
      mockUseCall.mockReturnValue(call);
      adm.getEngineState.mockImplementation(async () => {
        change(call);
        return deadEngine;
      });
      render(<AudioSessionDiagnosticsTracer />);
      await advance(3000 + 6000);

      expect(adm.getEngineState).toHaveBeenCalledTimes(1);
      expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
      expect(recoveryTraces(call)).toEqual([]);
      expect(call.rejoinForAudioEngineRecovery).not.toHaveBeenCalled();
    },
  );

  it('spaces the attempts 3 s from the end of the previous one', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    const startedAt: number[] = [];
    const returnedAt: number[] = [];
    adm.recoverEngineIfNeeded.mockImplementation(async () => {
      startedAt.push(Date.now());
      await new Promise((resolve) => setTimeout(resolve, 2000));
      returnedAt.push(Date.now());
      return { result: 'failed', before: deadEngine, codes: {} };
    });
    await renderJoined();
    await advance(2000);
    expect(returnedAt).toHaveLength(1);

    // 3 s after the start but only 1 s after the end: deferred
    appStateListener('active');
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);
    await advance(1999);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);
    await advance(1);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(2);
    await advance(2000 + 3000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);

    expect(startedAt.slice(1).map((t, i) => t - returnedAt[i]!)).toEqual([
      3000, 3000,
    ]);
  });

  it('does not spend the budget on skipped or healthy results', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'skipped',
      reason: 'gated',
      before: deadEngine,
      codes: {},
    });
    const call = await renderJoined();
    // skipped: no re-check
    await advance(10000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);

    for (let i = 0; i < 5; i++) {
      appStateListener('active');
      await advance(1000);
    }
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(6);
    expect(recoveryTraces(call).map((t) => t.attempt)).toEqual([
      1, 1, 1, 1, 1, 1,
    ]);
    expect(recoveryTraces(call)[0]).toEqual({
      trigger: 'joined',
      result: 'skipped',
      reason: 'gated',
      attempt: 1,
    });

    // the full budget is still available
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'failed',
      before: deadEngine,
      after: deadEngine,
      codes: {},
    });
    appStateListener('active');
    await advance(1000);
    await advance(6000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(9);
  });

  it('skips the recovery when the mic permission is missing', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    checkPermission.mockResolvedValue(false);
    const call = await renderJoined();

    expect(checkPermission).toHaveBeenCalledWith('microphone');
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
    expect(recoveryTraces(call)).toEqual([
      {
        trigger: 'joined',
        result: 'skipped',
        reason: 'noMicPermission',
        attempt: 1,
      },
    ]);
    // no re-check (the other sample is the 10 s session timeout check)
    await advance(30000);
    expect(recordingStateTraces(call)).toHaveLength(1);
    expect(recoveryTraces(call)).toHaveLength(1);
  });

  it('traces an unchanged unhealthy state once and a changed one again', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'skipped',
      reason: 'gated',
      before: deadEngine,
      codes: {},
    });
    const call = await renderJoined();
    mockLogger.warn.mockClear();

    appStateListener('active');
    await advance(1000);
    routeListener();
    await advance(1000);

    expect(adm.getEngineState).toHaveBeenCalledTimes(3);
    expect(recordingStateTraces(call)).toHaveLength(1);
    expect(
      mockLogger.warn.mock.calls.filter(
        ([msg]) => msg === 'the audio engine is not running as needed',
      ),
    ).toHaveLength(0);

    adm.getEngineState.mockResolvedValue({ ...deadEngine, isPlaying: false });
    appStateListener('active');
    await advance(1000);
    expect(recordingStateTraces(call)).toHaveLength(2);
    expect(
      mockLogger.warn.mock.calls.filter(
        ([msg]) => msg === 'the audio engine is not running as needed',
      ),
    ).toHaveLength(1);

    // healthy in between: the same unhealthy state is traced again
    adm.getEngineState.mockResolvedValue(healthyEngine);
    appStateListener('active');
    await advance(1000);
    adm.getEngineState.mockResolvedValue({ ...deadEngine, isPlaying: false });
    appStateListener('active');
    await advance(1000);
    expect(
      recordingStateTraces(call).filter((t) => t.isEngineRunning === false),
    ).toHaveLength(3);
  });

  it('traces the missing mic permission skip once per unchanged state', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    checkPermission.mockResolvedValue(false);
    const call = await renderJoined();

    appStateListener('active');
    await advance(1000);
    routeListener();
    await advance(1000);

    expect(checkPermission).toHaveBeenCalledTimes(3);
    expect(recoveryTraces(call)).toHaveLength(1);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
  });

  it('runs one check at a time', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    let resolveRecovery: (value: unknown) => void = () => {};
    adm.recoverEngineIfNeeded.mockReturnValue(
      new Promise((resolve) => {
        resolveRecovery = resolve;
      }),
    );
    await renderJoined();
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);

    appStateListener('active');
    interruptionListener({ source: 'callmanager', phase: 'ended' });
    await advance(1000);
    expect(adm.getEngineState).toHaveBeenCalledTimes(1);

    // the queued triggers run as one follow-up check when the first settles
    await act(async () => {
      resolveRecovery({ result: 'recovered', before: deadEngine, codes: {} });
    });
    await advance(1000);
    expect(adm.getEngineState).toHaveBeenCalledTimes(2);

    appStateListener('active');
    await advance(1000);
    expect(adm.getEngineState).toHaveBeenCalledTimes(3);
  });

  it('checks again when the mic is enabled', async () => {
    const call = makeCall();
    call.status$.next('disabled');
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    await advance(10000);
    expect(recordingStateTraces(call)).toHaveLength(0);

    act(() => {
      call.status$.next('enabled');
    });
    await advance(3000);
    expect(recordingStateTraces(call).map((s) => s.trigger)).toEqual([
      'joined',
    ]);

    adm.getEngineState.mockResolvedValue(deadEngine);
    act(() => {
      call.status$.next('disabled');
    });
    act(() => {
      call.status$.next('enabled');
    });
    await advance(3000);
    expect(recordingStateTraces(call).map((s) => s.trigger)).toEqual([
      'joined',
      'micEnabled',
    ]);
  });

  it.each([
    ['a reconnect', [CallingState.RECONNECTING, CallingState.JOINING]],
    ['a migration', [CallingState.MIGRATING, CallingState.JOINING]],
    // RECONNECTING and JOINING are emitted in one tick: React may render
    // only the latter
    ['a reconnect rendered as JOINING only', [CallingState.JOINING]],
  ])(
    'checks again when the call is back to JOINED after %s',
    async (_, states: CallingState[]) => {
      const call = await renderJoined();

      states.forEach((state) => {
        act(() => {
          call.callingState$.next(state);
        });
      });
      adm.getEngineState.mockResolvedValue(deadEngine);
      act(() => {
        call.callingState$.next(CallingState.JOINED);
      });
      await advance(3000);

      expect(recordingStateTraces(call).map((s) => s.trigger)).toEqual([
        'joined',
        'reconnected',
      ]);
    },
  );

  it('checks again when the app becomes active or the audio route changes', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'skipped',
      reason: 'gated',
      before: deadEngine,
      codes: {},
    });
    const call = await renderJoined();

    appStateListener('background');
    await advance(1000);
    appStateListener('active');
    await advance(1000);
    // one pending check per trigger
    routeListener();
    routeListener();
    await advance(1000);

    // joined, appActive, audioRouteChanged (the unchanged state is traced once)
    expect(adm.getEngineState).toHaveBeenCalledTimes(3);
    expect(recordingStateTraces(call)).toHaveLength(1);
  });

  it('warns only for native audio session errors', () => {
    const call = makeCall();
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    diagnosticListener({ event: 'engineEnableApplied' });
    expect(mockLogger.warn).not.toHaveBeenCalled();

    diagnosticListener({ event: 'setMuteModeError', result: -1 });
    expect(mockLogger.warn.mock.calls.map(([msg]) => msg)).toEqual([
      'ios.audioSession.setMuteModeError',
    ]);
  });

  it('traces native audio session diagnostics', () => {
    const call = makeCall();
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    const event = { ...sessionState, event: 'engineEnableError', error: 'e' };
    diagnosticListener(event);

    expect(call.tracer.trace).toHaveBeenCalledWith(
      'ios.audioSession.engineEnableError',
      event,
    );
  });

  it('re-samples after an interruption ends', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'skipped',
      reason: 'gated',
      before: deadEngine,
      codes: {},
    });
    const call = await renderJoined();

    interruptionListener({ source: 'callmanager', phase: 'began' });
    await advance(1000);
    interruptionListener({ source: 'callmanager', phase: 'ended' });
    await advance(1000);

    // joined, interruptionEnded
    expect(adm.getEngineState).toHaveBeenCalledTimes(2);
    expect(recordingStateTraces(call)).toHaveLength(1);
  });

  it('samples after a callingx audio session activation', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'skipped',
      reason: 'gated',
      before: deadEngine,
      codes: {},
    });
    const listeners: Partial<Record<string, () => void>> = {};
    (getCallingxLibIfAvailable as jest.Mock).mockReturnValue({
      isSetup: true,
      addEventListener: jest.fn((name: string, listener: () => void) => {
        listeners[name] = listener;
        return { remove: jest.fn() };
      }),
    });
    const call = await renderJoined();

    listeners.didActivateAudioSession?.();
    await advance(1000);

    // joined, audioSessionActivated
    expect(adm.getEngineState).toHaveBeenCalledTimes(2);
    expect(recordingStateTraces(call)).toHaveLength(1);
  });

  it('does not check the engine while the audio is interrupted', async () => {
    const call = await renderJoined();
    adm.getEngineState.mockClear();
    adm.getEngineState.mockResolvedValue(deadEngine);

    interruptionListener({ source: 'callmanager', phase: 'began' });
    routeListener();
    act(() => {
      call.status$.next('disabled');
    });
    act(() => {
      call.status$.next('enabled');
    });
    await advance(5000);
    expect(adm.getEngineState).not.toHaveBeenCalled();
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();

    interruptionListener({ source: 'callmanager', phase: 'ended' });
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);
    expect(recoveryTraces(call).map((t) => [t.trigger, t.attempt])).toEqual([
      ['interruptionEnded', 1],
    ]);
  });

  it('resumes the checks when the app becomes active during an interruption', async () => {
    const call = await renderJoined();
    adm.getEngineState.mockResolvedValue(deadEngine);

    interruptionListener({ source: 'callmanager', phase: 'began' });
    routeListener();
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();

    appStateListener('active');
    await advance(1000);
    expect(recoveryTraces(call).map((t) => t.trigger)).toEqual(['appActive']);
  });

  it('resumes the checks after a callingx audio session activation during an interruption', async () => {
    const listeners: Partial<Record<string, (event?: unknown) => void>> = {};
    (getCallingxLibIfAvailable as jest.Mock).mockReturnValue({
      isSetup: true,
      addEventListener: jest.fn(
        (name: string, listener: (event?: unknown) => void) => {
          listeners[name] = listener;
          return { remove: jest.fn() };
        },
      ),
    });
    const call = await renderJoined();
    adm.getEngineState.mockResolvedValue(deadEngine);

    listeners.didAudioInterruption?.({ source: 'callingx', phase: 'began' });
    routeListener();
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();

    listeners.didActivateAudioSession?.();
    await advance(1000);
    expect(recoveryTraces(call).map((t) => t.trigger)).toEqual([
      'audioSessionActivated',
    ]);
  });

  it('does not rejoin while the audio is interrupted', async () => {
    adm.getEngineState.mockResolvedValue(deadEngine);
    // the interruption begins during the last attempt of the episode
    adm.recoverEngineIfNeeded.mockImplementation(async () => {
      if (adm.recoverEngineIfNeeded.mock.calls.length === 3) {
        interruptionListener({ source: 'callmanager', phase: 'began' });
      }
      return { result: 'failed', before: deadEngine, codes: {} };
    });
    const call = await renderJoined();
    await advance(6000);

    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(3);
    expect(call.rejoinForAudioEngineRecovery).not.toHaveBeenCalled();
    expect(tracesOf(call, 'ios.audioEngine.rejoin')).toEqual([]);
  });

  it('waits for the next signal, keeping the budget, while iOS refuses to re-activate the session', async () => {
    const call = await renderJoined();
    adm.getEngineState.mockResolvedValue({
      ...deadEngine,
      sessionActive: false,
    });
    iosCallManager.reactivateAudioSession.mockRejectedValue(
      Object.assign(new Error('!int'), { code: '561017449' }),
    );

    appStateListener('active');
    await advance(1000);
    expect(iosCallManager.reactivateAudioSession).toHaveBeenCalledTimes(1);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
    expect(recoveryTraces(call)).toEqual([
      {
        trigger: 'appActive',
        result: 'skipped',
        reason: 'sessionRefused',
        attempt: 1,
      },
    ]);

    // no checks until a signal
    routeListener();
    act(() => {
      call.status$.next('disabled');
    });
    act(() => {
      call.status$.next('enabled');
    });
    await advance(5000);
    expect(iosCallManager.reactivateAudioSession).toHaveBeenCalledTimes(1);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();

    // the real interruption end re-activated the session: full budget left
    adm.getEngineState.mockResolvedValue(deadEngine);
    interruptionListener({ source: 'callmanager', phase: 'ended' });
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);
    expect(
      recoveryTraces(call)
        .slice(1)
        .map((t) => [t.trigger, t.attempt]),
    ).toEqual([['interruptionEnded', 1]]);
    expect(call.rejoinForAudioEngineRecovery).not.toHaveBeenCalled();
  });

  it('recovers after re-activating the inactive session itself', async () => {
    const call = await renderJoined();
    adm.getEngineState.mockResolvedValue({
      ...deadEngine,
      sessionActive: false,
    });
    adm.recoverEngineIfNeeded.mockResolvedValue({
      result: 'recovered',
      before: deadEngine,
      after: healthyEngine,
      codes: { stopRecording: 0, startRecording: 0 },
    });

    appStateListener('active');
    await advance(1000);
    expect(iosCallManager.reactivateAudioSession).toHaveBeenCalledTimes(1);
    expect(adm.recoverEngineIfNeeded).toHaveBeenCalledTimes(1);
    expect(recoveryTraces(call)).toEqual([
      expect.objectContaining({
        trigger: 'appActive',
        result: 'recovered',
        attempt: 1,
      }),
    ]);
  });

  it('waits when the session stays inactive after the re-activation', async () => {
    const call = await renderJoined();
    adm.getEngineState.mockResolvedValue({
      ...deadEngine,
      sessionActive: false,
    });
    iosCallManager.reactivateAudioSession.mockResolvedValue(false);

    appStateListener('active');
    await advance(1000);
    expect(adm.recoverEngineIfNeeded).not.toHaveBeenCalled();
    expect(recoveryTraces(call)).toEqual([
      {
        trigger: 'appActive',
        result: 'skipped',
        reason: 'sessionInactive',
        attempt: 1,
      },
    ]);
    expect(mockLogger.warn).not.toHaveBeenCalledWith(
      'failed to re-activate the audio session',
      expect.anything(),
    );
  });

  it('traces audio engine errors and unsubscribes on unmount', () => {
    const call = makeCall();
    mockUseCall.mockReturnValue(call);
    const { unmount } = render(<AudioSessionDiagnosticsTracer />);

    engineErrorListener({
      message: 'x'.repeat(300),
      severity: 'error',
      timestamp: 1,
      repeat: 2,
    });
    engineErrorListener({ message: 'w', severity: 'warning', timestamp: 2 });

    expect(tracesOf(call, 'ios.audioEngine.error')).toEqual([
      { message: 'x'.repeat(200), severity: 'error', repeat: 2 },
      { message: 'w', severity: 'warning' },
    ]);

    unmount();
    expect(removeEngineErrorListener).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe to anything on Android', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';
    try {
      const call = makeCall();
      call.callingState$.next(CallingState.JOINED);
      mockUseCall.mockReturnValue(call);
      render(<AudioSessionDiagnosticsTracer />);
      await advance(15000);

      expect(admEvents.addEngineErrorListener).not.toHaveBeenCalled();
      expect(adm.getEngineState).not.toHaveBeenCalled();
      expect(call.tracer.trace).not.toHaveBeenCalled();
    } finally {
      Platform.OS = originalOS;
    }
  });

  it('traces a session timeout when the session is inactive 10 s after joining', async () => {
    adm.getEngineState.mockResolvedValue({
      ...healthyEngine,
      sessionActive: false,
      sessionCategory: 'AVAudioSessionCategoryPlayback',
    });
    const call = makeCall();
    call.status$.next('disabled');
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });

    await advance(9999);
    expect(tracesOf(call, 'audio.session.timeout')).toEqual([]);
    await advance(1);
    expect(tracesOf(call, 'audio.session.timeout')).toEqual([
      { category: 'AVAudioSessionCategoryPlayback' },
    ]);

    // once per mount, not again after a reconnect
    reconnect(call);
    await advance(20000);
    expect(tracesOf(call, 'audio.session.timeout')).toHaveLength(1);
  });

  it('does not trace a session timeout when the session is active', async () => {
    const call = await renderJoined();
    await advance(10000);

    expect(tracesOf(call, 'audio.session.timeout')).toEqual([]);
  });

  it('still traces the session timeout when the session state read throws', async () => {
    adm.getEngineState.mockResolvedValue({
      ...healthyEngine,
      sessionActive: false,
    });
    iosCallManager.getAudioSessionState.mockImplementation(() => {
      throw new Error('native failure');
    });
    const call = makeCall();
    call.status$.next('disabled');
    call.callingState$.next(CallingState.JOINED);
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    await advance(10000);

    expect(tracesOf(call, 'audio.session.timeout')).toHaveLength(1);
    expect(mockLogger.warn).toHaveBeenCalledWith(
      'failed to read the audio session state',
      expect.any(Error),
    );
  });

  it('does not trace a session timeout when callingx owns the session', async () => {
    adm.getEngineState.mockResolvedValue({
      ...healthyEngine,
      sessionActive: false,
    });
    iosCallManager.getAudioSessionState.mockReturnValue({
      ...sessionState,
      callingxOwnsSession: true,
    });
    const call = makeCall();
    call.status$.next('disabled');
    call.callingState$.next(CallingState.JOINED);
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    await advance(10000);

    expect(tracesOf(call, 'audio.session.timeout')).toEqual([]);
    expect(adm.getEngineState).not.toHaveBeenCalled();
  });
});
