import React from 'react';
import { act, render } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';
import { CallingState } from '@stream-io/video-client';
import { AudioDeviceModule } from '@stream-io/react-native-webrtc';
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
    isRecording: jest.fn(),
    isPlaying: jest.fn(),
    isEngineRunning: jest.fn(),
    isMicrophoneMuted: jest.fn(),
    getMuteMode: jest.fn(),
    isRecordingAlwaysPreparedMode: jest.fn(),
  },
}));
jest.mock('../../src/modules/call-manager', () => ({
  callManager: {
    ios: {
      getAudioSessionState: jest.fn(),
      addAudioSessionDiagnosticListener: jest.fn(),
      addAudioInterruptionListener: jest.fn(),
    },
  },
}));
jest.mock('../../src/utils/push/libs/callingx', () => ({
  getCallingxLibIfAvailable: jest.fn(),
}));

const adm = AudioDeviceModule as unknown as {
  isRecording: jest.Mock;
  isPlaying: jest.Mock;
  isEngineRunning: jest.Mock;
  isMicrophoneMuted: jest.Mock;
  getMuteMode: jest.Mock;
  isRecordingAlwaysPreparedMode: jest.Mock;
};
const iosCallManager = callManager.ios as unknown as {
  getAudioSessionState: jest.Mock;
  addAudioSessionDiagnosticListener: jest.Mock;
  addAudioInterruptionListener: jest.Mock;
};
const sessionState = {
  category: 'PlayAndRecord',
  route: 'MicrophoneBuiltIn>Speaker',
  micPermission: 'undetermined',
};

const makeCall = () => {
  const callingState$ = new BehaviorSubject(CallingState.JOINING);
  const status$ = new BehaviorSubject<string | undefined>('enabled');
  return {
    callingState$,
    status$,
    tracer: { trace: jest.fn() },
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

const recordingStateTraces = (call: ReturnType<typeof makeCall>) =>
  call.tracer.trace.mock.calls.filter(
    ([tag]) => tag === 'ios.audioRecording.state',
  );

describe('AudioSessionDiagnosticsTracer', () => {
  let diagnosticListener: (event: unknown) => void;
  let interruptionListener: (event: unknown) => void;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    (getCallingxLibIfAvailable as jest.Mock).mockReturnValue(undefined);
    iosCallManager.getAudioSessionState.mockReturnValue(sessionState);
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
    adm.isRecording.mockReturnValue(true);
    adm.isPlaying.mockReturnValue(true);
    adm.getMuteMode.mockReturnValue(0);
    adm.isRecordingAlwaysPreparedMode.mockReturnValue(false);
    adm.isEngineRunning.mockReturnValue(true);
    adm.isMicrophoneMuted.mockReturnValue(false);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('traces a minimal healthy sample after joining, without callingx', () => {
    const call = makeCall();
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    jest.advanceTimersByTime(3000);

    expect(recordingStateTraces(call)).toEqual([
      [
        'ios.audioRecording.state',
        {
          trigger: 'joined',
          isRecording: true,
          isPlaying: true,
          isEngineRunning: true,
          isMicrophoneMuted: false,
        },
      ],
    ]);
    expect(iosCallManager.getAudioSessionState).not.toHaveBeenCalled();

    // healthy: no re-check
    jest.advanceTimersByTime(20000);
    expect(recordingStateTraces(call)).toHaveLength(1);
  });

  it('does not re-trace an unchanged healthy state', () => {
    const call = makeCall();
    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    jest.advanceTimersByTime(3000);

    interruptionListener({ source: 'callmanager', phase: 'ended' });
    jest.advanceTimersByTime(1000);
    expect(recordingStateTraces(call)).toHaveLength(1);

    adm.isPlaying.mockReturnValue(false);
    interruptionListener({ source: 'callmanager', phase: 'ended' });
    jest.advanceTimersByTime(1000);
    expect(recordingStateTraces(call)).toHaveLength(2);
  });

  it('adds details to unhealthy samples and re-checks once', () => {
    adm.isRecording.mockReturnValue(false);
    adm.isPlaying.mockReturnValue(false);
    adm.isEngineRunning.mockReturnValue(false);
    adm.isMicrophoneMuted.mockReturnValue(true);
    const call = makeCall();
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    jest.advanceTimersByTime(3000);
    jest.advanceTimersByTime(10000);
    jest.advanceTimersByTime(30000);

    const traces = recordingStateTraces(call);
    expect(traces.map(([, s]) => s.trigger)).toEqual(['joined', 'recheck']);
    expect(traces[0][1]).toEqual({
      trigger: 'joined',
      isRecording: false,
      isPlaying: false,
      isEngineRunning: false,
      isMicrophoneMuted: true,
      muteMode: 0,
      alwaysPrepared: false,
      session: sessionState,
    });
  });

  it('samples once the mic is enabled after joining muted', () => {
    const call = makeCall();
    call.status$.next('disabled');
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    jest.advanceTimersByTime(10000);
    expect(recordingStateTraces(call)).toHaveLength(0);

    act(() => {
      call.status$.next('enabled');
    });
    jest.advanceTimersByTime(3000);
    expect(recordingStateTraces(call).map(([, s]) => s.trigger)).toEqual([
      'joined',
    ]);

    // toggling the mic again does not re-schedule the initial sample
    act(() => {
      call.status$.next('disabled');
    });
    act(() => {
      call.status$.next('enabled');
    });
    jest.advanceTimersByTime(3000);
    expect(recordingStateTraces(call)).toHaveLength(1);
  });

  it('does not warn for an expected callingx-owned engine enable skip', () => {
    const call = makeCall();
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);

    const skip = { event: 'engineEnableSkipped', callingxOwnsSession: true };
    diagnosticListener(skip);
    expect(call.tracer.trace).toHaveBeenCalledWith(
      'ios.audioSession.engineEnableSkipped',
      skip,
    );
    expect(mockLogger.warn).not.toHaveBeenCalled();

    diagnosticListener({ event: 'engineEnableSkipped' });
    diagnosticListener({ event: 'setMuteModeError', result: -1 });
    diagnosticListener({ event: 'engineEnableApplied' });
    expect(mockLogger.warn.mock.calls.map(([msg]) => msg)).toEqual([
      'ios.audioSession.engineEnableSkipped',
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

  it('re-samples after an interruption ends', () => {
    adm.isEngineRunning.mockReturnValue(false);
    const call = makeCall();
    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    jest.advanceTimersByTime(3000);

    interruptionListener({ source: 'callmanager', phase: 'began' });
    jest.advanceTimersByTime(1000);
    interruptionListener({ source: 'callmanager', phase: 'ended' });
    jest.advanceTimersByTime(1000);

    expect(recordingStateTraces(call).map(([, s]) => s.trigger)).toEqual([
      'joined',
      'interruptionEnded',
    ]);
  });

  it('samples after a callingx audio session activation', () => {
    adm.isEngineRunning.mockReturnValue(false);
    const listeners: Partial<Record<string, () => void>> = {};
    (getCallingxLibIfAvailable as jest.Mock).mockReturnValue({
      isSetup: true,
      addEventListener: jest.fn((name: string, listener: () => void) => {
        listeners[name] = listener;
        return { remove: jest.fn() };
      }),
    });
    const call = makeCall();
    act(() => {
      call.callingState$.next(CallingState.JOINED);
    });
    mockUseCall.mockReturnValue(call);
    render(<AudioSessionDiagnosticsTracer />);
    jest.advanceTimersByTime(3000);

    listeners.didActivateAudioSession?.();
    jest.advanceTimersByTime(1000);

    expect(recordingStateTraces(call).map(([, s]) => s.trigger)).toEqual([
      'joined',
      'audioSessionActivated',
    ]);
  });
});
