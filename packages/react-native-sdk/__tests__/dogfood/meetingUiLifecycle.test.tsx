import React from 'react';
import { act, cleanup, render } from '@testing-library/react-native';

/**
 * The dogfood meeting screen's Call lifetime.
 *
 * One `Call` is one call flow, and the sample has to honour that itself: the
 * SDK cannot see a leave that finished before the public join even started, so
 * a join handler still awaiting encryption setup is the app's to cancel. These
 * cover that, and the teardown of a flow whose join failed.
 *
 * They live in this package rather than in the sample because the sample has no
 * Jest setup of its own, and standing one up for two components is more
 * machinery than the coverage is worth.
 */

let mockCall: any;
const mockAppSetState = jest.fn();
let mockLobbyProps: any;
let mockErrorProps: any;
let mockActiveCallProps: any;

jest.mock('@stream-io/video-react-native-sdk', () => {
  class Manager {
    static isSupported = jest.fn(() => true);
    static create = jest.fn();
    dispose = jest.fn();
    setSharedKey = jest.fn();
    requestKeyState = jest.fn();
    on = () => () => {};
  }
  return {
    EncryptionManager: Manager,
    EncryptionSettingsRequestModeEnum: { AUTO_ON: 'auto-on' },
    EncryptionSettingsResponseModeEnum: { AUTO_ON: 'auto-on' },
    CallingState: { LEFT: 'left', JOINED: 'joined', IDLE: 'idle' },
    useCall: () => mockCall,
    useI18n: () => ({ t: (key: string) => key }),
    useCallStateHooks: () => ({
      useRemoteParticipants: () => [],
      useCallCallingState: () => mockCall?.state?.callingState,
    }),
  };
});

jest.mock(
  'react-native-quick-crypto',
  () => ({ pbkdf2Sync: () => new Uint8Array(16) }),
  { virtual: true },
);

// literal paths: `jest.mock` is hoisted above any local that would shorten them
const DOGFOOD = '../../../../sample-apps/react-native/dogfood/src';
jest.mock(
  '../../../../sample-apps/react-native/dogfood/src/contexts/createStoreContext',
  () => ({ mmkvStorage: { getString: () => JSON.stringify('a-passphrase') } }),
);
jest.mock(
  '../../../../sample-apps/react-native/dogfood/src/contexts/AppContext',
  () => ({ useAppGlobalStoreSetState: () => mockAppSetState }),
);
jest.mock(
  '../../../../sample-apps/react-native/dogfood/src/contexts/LayoutContext',
  () => ({ LayoutProvider: ({ children }: any) => children }),
);
jest.mock(
  '../../../../sample-apps/react-native/dogfood/src/components/LobbyViewComponent',
  () => ({
    LobbyViewComponent: (props: any) => {
      mockLobbyProps = props;
      return null;
    },
  }),
);
jest.mock(
  '../../../../sample-apps/react-native/dogfood/src/components/ActiveCall',
  () => ({
    ActiveCall: (props: any) => {
      mockActiveCallProps = props;
      return null;
    },
  }),
);
jest.mock(
  '../../../../sample-apps/react-native/dogfood/src/components/AuthenticatingProgress',
  () => ({ AuthenticationProgress: () => null }),
);
jest.mock(
  '../../../../sample-apps/react-native/dogfood/src/components/CallErrorComponent',
  () => ({
    CallErrorComponent: (props: any) => {
      mockErrorProps = props;
      return null;
    },
  }),
);
void DOGFOOD;

// Required, not imported. A static import would pull the sample's whole tree
// into this package's type-check, where it sits outside `rootDir`; the paths
// below are plain strings that `tsc` never resolves. The SDK is taken from its
// mock for a similar reason - this package cannot list itself as a dependency.
const { MeetingUI } = jest.requireActual(
  '../../../../sample-apps/react-native/dogfood/src/components/MeetingUI',
) as { MeetingUI: React.ComponentType<any> };
const { EncryptionManager } = jest.requireMock(
  '@stream-io/video-react-native-sdk',
) as { EncryptionManager: any };

const fakeCall = (overrides: Partial<any> = {}) => {
  const call: any = {
    currentUserId: 'dogfood-user',
    state: { callingState: 'idle' },
    setE2EEManager: jest.fn((manager: any) => {
      call.e2eeManager = manager;
    }),
    join: jest.fn().mockResolvedValue(undefined),
    leave: jest.fn(async () => {
      call.state.callingState = 'left';
    }),
    ...overrides,
  };
  return call;
};

const navigation = () => ({
  navigate: jest.fn(),
  popTo: jest.fn(),
  goBack: jest.fn(),
});

const renderMeeting = (nav = navigation()) => {
  const view = render(
    <MeetingUI callId="dogfood" navigation={nav as any} route={{} as any} />,
  );
  return { view, nav };
};

/** Swaps in a replacement Call, the way a changed callId or client does. */
const replaceCall = (view: any, nav: any, next: any) => {
  mockCall = next;
  view.rerender(
    <MeetingUI callId="dogfood" navigation={nav as any} route={{} as any} />,
  );
};

/**
 * A `leave()` that stays pending for every caller until released.
 *
 * One shared promise on purpose: a failed join and the unmount cleanup both
 * call leave, and a fresh deferred per call would strand the first caller.
 */
const pendingLeave = () => {
  let release!: () => void;
  const promise = new Promise<void>((resolve) => (release = resolve));
  return { leave: jest.fn(() => promise), release: () => release() };
};

/** Holds `EncryptionManager.create` open until the test releases it. */
const deferCreate = () => {
  let release!: (manager: any) => void;
  (EncryptionManager.create as jest.Mock).mockImplementation(
    () => new Promise((resolve) => (release = resolve)),
  );
  return (manager: any) => release(manager);
};

const settle = () => act(async () => void (await Promise.resolve()));

beforeEach(() => {
  jest.clearAllMocks();
  mockLobbyProps = undefined;
  mockErrorProps = undefined;
  mockActiveCallProps = undefined;
  (EncryptionManager.isSupported as jest.Mock).mockReturnValue(true);
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
});

describe('a join whose screen ends while encryption is still being prepared', () => {
  it('does not join the discarded call, and releases the late manager', async () => {
    const finishCreate = deferCreate();
    mockCall = fakeCall();
    const { view } = renderMeeting();

    let joining!: Promise<void>;
    act(() => {
      joining = mockLobbyProps.onJoinCallHandler();
    });
    // Android Back, say: the screen goes while the manager is still being made
    view.unmount();
    await settle();
    expect(mockCall.state.callingState).toBe('left');

    const manager = new (EncryptionManager as any)();
    await act(async () => {
      finishCreate(manager);
      await joining;
    });

    expect(mockCall.join).not.toHaveBeenCalled();
    expect(manager.dispose).toHaveBeenCalledTimes(1);
  });

  it('waits for an in-flight leave before releasing the late manager', async () => {
    const finishCreate = deferCreate();
    const leave = pendingLeave();
    mockCall = fakeCall({ leave: leave.leave });
    const { view } = renderMeeting();

    let joining!: Promise<void>;
    act(() => {
      joining = mockLobbyProps.onJoinCallHandler();
    });
    view.unmount();
    await settle();
    // the screen is gone but its leave has not finished, so a LEFT check alone
    // would still read `idle` here
    expect(mockCall.state.callingState).toBe('idle');

    const manager = new (EncryptionManager as any)();
    finishCreate(manager);
    await act(async () => {
      mockCall.state.callingState = 'left';
      leave.release();
      await joining;
    });

    expect(mockCall.join).not.toHaveBeenCalled();
    // both owners can reach it here - the cleanup's own disposal runs once its
    // leave settles, and this continuation's runs after that - so only the
    // release itself is asserted; `dispose()` is idempotent by contract
    expect(manager.dispose).toHaveBeenCalled();
  });

  it('still prepares once for two initial taps', async () => {
    const finishCreate = deferCreate();
    mockCall = fakeCall();
    renderMeeting();

    let first!: Promise<void>;
    let second!: Promise<void>;
    act(() => {
      first = mockLobbyProps.onJoinCallHandler();
      second = mockLobbyProps.onJoinCallHandler();
    });
    expect(EncryptionManager.create).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishCreate(new (EncryptionManager as any)());
      await Promise.all([first, second]);
    });

    expect(mockCall.join).toHaveBeenCalledTimes(1);
  });
});

describe('a meeting whose join failed', () => {
  const joinAndFail = async () => {
    const manager = new (EncryptionManager as any)();
    (EncryptionManager.create as jest.Mock).mockResolvedValue(manager);
    mockCall = fakeCall();
    mockCall.join.mockRejectedValue(new Error('join failed'));
    const { nav, view } = renderMeeting();
    await act(async () => {
      await mockLobbyProps.onJoinCallHandler();
    });
    return { manager, nav, view };
  };

  it('leaves the call and releases its manager', async () => {
    const { manager } = await joinAndFail();

    expect(mockCall.state.callingState).toBe('left');
    expect(manager.dispose).toHaveBeenCalledTimes(1);
    // no lobby button: that Call is finished with
    expect(mockErrorProps.backToLobbyHandler).toBeUndefined();
  });

  it('removes the finished route on Return to Home', async () => {
    const { nav } = await joinAndFail();

    act(() => mockErrorProps.returnToHomeHandler());

    // `navigate` would push a second JoinMeetingScreen and leave this one
    // mounted underneath it, reachable with Back
    expect(nav.popTo).toHaveBeenCalledWith('JoinMeetingScreen');
    expect(nav.navigate).not.toHaveBeenCalledWith('JoinMeetingScreen');
  });

  it('gives the next entry a different call and manager', async () => {
    const first = await joinAndFail();
    const firstCall = mockCall;
    // Return to Home pops this route, so the screen unmounts
    await act(async () => first.view.unmount());

    const second = await joinAndFail();

    expect(mockCall).not.toBe(firstCall);
    expect(second.manager).not.toBe(first.manager);
    expect(mockCall.join).toHaveBeenCalledTimes(1);
  });
});

describe('a live meeting whose leave failed', () => {
  it('keeps its manager and still offers the lobby', async () => {
    const manager = new (EncryptionManager as any)();
    (EncryptionManager.create as jest.Mock).mockResolvedValue(manager);
    mockCall = fakeCall({
      leave: jest.fn().mockRejectedValue(new Error('leave failed')),
    });
    mockCall.join.mockRejectedValue(new Error('join failed'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    renderMeeting();

    await act(async () => {
      await mockLobbyProps.onJoinCallHandler();
    });

    // the call may still have live peers using this manager
    expect(mockCall.state.callingState).not.toBe('left');
    expect(manager.dispose).not.toHaveBeenCalled();
  });
});

/**
 * Both parents keep one mounted MeetingUI across a change of `Call`, so the
 * screen has to keep the two flows apart itself: the abandoned one must not
 * hold the replacement's pending-join guard, and must not finish later into
 * the replacement's view or the app store.
 */
describe('a Call replaced while its flow is still running', () => {
  it('does not make the replacement wait on the abandoned setup', async () => {
    let releaseA!: (manager: any) => void;
    (EncryptionManager.create as jest.Mock)
      .mockImplementationOnce(
        () => new Promise((resolve) => (releaseA = resolve)),
      )
      .mockResolvedValue(new (EncryptionManager as any)());
    const callA = fakeCall();
    mockCall = callA;
    const { view, nav } = renderMeeting();

    act(() => void mockLobbyProps.onJoinCallHandler());
    const callB = fakeCall();
    replaceCall(view, nav, callB);

    // B's own guard, not A's: A's preparation has no bounded timeout here
    await act(async () => {
      await mockLobbyProps.onJoinCallHandler();
    });

    expect(callB.join).toHaveBeenCalledTimes(1);
    expect(callA.join).not.toHaveBeenCalled();

    // let A finish so it releases its own manager and nothing else
    const managerA = new (EncryptionManager as any)();
    await act(async () => {
      releaseA(managerA);
      await Promise.resolve();
    });
    expect(managerA.dispose).toHaveBeenCalled();
    expect(callB.e2eeManager.dispose).not.toHaveBeenCalled();
  });

  it('does not show the replacement as active when the old join resolves', async () => {
    (EncryptionManager.create as jest.Mock).mockResolvedValue(
      new (EncryptionManager as any)(),
    );
    let finishJoinA!: () => void;
    const callA = fakeCall({
      join: jest.fn(() => new Promise<void>((r) => (finishJoinA = r))),
    });
    mockCall = callA;
    const { view, nav } = renderMeeting();

    let joiningA!: Promise<void>;
    await act(async () => {
      joiningA = mockLobbyProps.onJoinCallHandler();
      await Promise.resolve();
    });
    replaceCall(view, nav, fakeCall());

    // core can resolve a superseded join rather than reject it
    await act(async () => {
      finishJoinA();
      await joiningA;
    });

    expect(mockActiveCallProps).toBeUndefined();
    expect(mockLobbyProps).toBeDefined();
    expect(mockAppSetState).not.toHaveBeenCalled();
  });

  it("does not replace the new lobby with the old flow's error", async () => {
    (EncryptionManager.create as jest.Mock).mockResolvedValue(
      new (EncryptionManager as any)(),
    );
    const leaveA = pendingLeave();
    const callA = fakeCall({
      join: jest.fn().mockRejectedValue(new Error('join failed')),
      leave: leaveA.leave,
    });
    mockCall = callA;
    const { view, nav } = renderMeeting();

    let joiningA!: Promise<void>;
    await act(async () => {
      joiningA = mockLobbyProps.onJoinCallHandler();
      await Promise.resolve();
    });
    replaceCall(view, nav, fakeCall());

    await act(async () => {
      callA.state.callingState = 'left';
      leaveA.release();
      await joiningA;
    });

    expect(mockErrorProps).toBeUndefined();
    expect(mockLobbyProps).toBeDefined();
  });
});

/**
 * A leave that rejects may have stopped short of disposing the peers, which are
 * still encrypting through the manager. Every disposal path has to agree on
 * that, not just the failed-join one.
 */
describe('a teardown that failed', () => {
  it('keeps the manager when both the failed join and the unmount leave fail', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const manager = new (EncryptionManager as any)();
    (EncryptionManager.create as jest.Mock).mockResolvedValue(manager);
    mockCall = fakeCall({
      join: jest.fn().mockRejectedValue(new Error('join failed')),
      leave: jest.fn().mockRejectedValue(new Error('leave failed')),
    });
    const { view } = renderMeeting();

    await act(async () => {
      await mockLobbyProps.onJoinCallHandler();
    });
    expect(manager.dispose).not.toHaveBeenCalled();

    // Return to Home pops the route, so the screen unmounts
    await act(async () => view.unmount());

    expect(mockCall.state.callingState).not.toBe('left');
    expect(manager.dispose).not.toHaveBeenCalled();
  });

  it('keeps the manager of a joined call whose hangup and unmount leave fail', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const manager = new (EncryptionManager as any)();
    (EncryptionManager.create as jest.Mock).mockResolvedValue(manager);
    mockCall = fakeCall({
      leave: jest.fn().mockRejectedValue(new Error('leave failed')),
    });
    mockCall.join.mockImplementation(async () => {
      mockCall.state.callingState = 'joined';
    });
    const { view } = renderMeeting();

    await act(async () => {
      await mockLobbyProps.onJoinCallHandler();
    });
    expect(mockActiveCallProps).toBeDefined();

    await act(async () => {
      await mockActiveCallProps.onHangupCallHandler();
    });
    await act(async () => view.unmount());

    expect(mockCall.state.callingState).toBe('joined');
    expect(manager.dispose).not.toHaveBeenCalled();
  });

  it('still releases the manager once a pending leave succeeds', async () => {
    let finishCreate!: (manager: any) => void;
    (EncryptionManager.create as jest.Mock).mockImplementation(
      () => new Promise((resolve) => (finishCreate = resolve)),
    );
    const leave = pendingLeave();
    mockCall = fakeCall({ leave: leave.leave });
    const { view } = renderMeeting();

    let joining!: Promise<void>;
    act(() => {
      joining = mockLobbyProps.onJoinCallHandler();
    });
    view.unmount();
    await settle();

    const manager = new (EncryptionManager as any)();
    finishCreate(manager);
    await act(async () => {
      mockCall.state.callingState = 'left';
      leave.release();
      await joining;
    });

    expect(manager.dispose).toHaveBeenCalled();
  });
});
