/**
 * Tests for the Android Telecom (callingx) audio-routing branch in CallManager.
 * The SDK delegates routing to callingx when a call is Telecom-managed, adapting callingx's
 * generic endpoint primitives to the cross-platform AudioDevicesState shape.
 */

type Snapshot = {
  endpoints: { id: string; name: string; type: string }[];
  currentEndpoint: { id: string; name: string; type: string } | null;
};

const makeNativeManager = () => ({
  setTelecomManagedMode: jest.fn(),
  setAudioRole: jest.fn(),
  setDefaultAudioDeviceEndpointType: jest.fn(),
  setDisableCommunicationModeWorkaround: jest.fn(),
  setEnableStereoAudioOutput: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  setup: jest.fn(),
  chooseAudioDeviceEndpoint: jest.fn(),
  getAudioDeviceStatus: jest.fn(),
  setForceSpeakerphoneOn: jest.fn(),
});

const makeCallingx = (overrides: Partial<any> = {}) => ({
  isSetup: true,
  isTelecomBacked: true,
  isOngoingCallsEnabled: false,
  hasRegisteredCall: jest.fn().mockReturnValue(true),
  isCallTracked: jest.fn().mockReturnValue(true),
  getRegisteredCallIds: jest.fn().mockReturnValue(['type:id']),
  getAvailableAudioEndpoints: jest.fn(),
  requestAudioEndpointChange: jest.fn().mockResolvedValue(undefined),
  setDefaultAudioDeviceEndpointType: jest.fn(),
  addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
  ...overrides,
});

/** Load CallManager with the given platform + mocked native/callingx modules. */
const loadCallManager = ({
  os,
  nativeManager,
  callingx,
}: {
  os: 'android' | 'ios';
  nativeManager: ReturnType<typeof makeNativeManager>;
  callingx: ReturnType<typeof makeCallingx> | undefined;
}) => {
  let mod!: typeof import('../../src/modules/call-manager/CallManager');
  let publicCallManager!: import('../../src/modules/call-manager/CallManager').CallManager;
  let internalCallManager!: NonNullable<
    typeof globalThis.streamRNVideoSDK
  >['callManager'];
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: os, select: (o: any) => o[os] },
      NativeModules: {
        StreamInCallManager: nativeManager,
        StreamVideoReactNative: {},
      }, // mock to avoid pulling the video-client / react-native-webrtc runtime into the test
      NativeEventEmitter: class {
        addListener() {
          return { remove: jest.fn() };
        }
      },
    }));
    jest.doMock('../../src/utils/push/libs/callingx', () => ({
      getCallingxLibIfAvailable: () => callingx,
    }));
    jest.doMock('../../src/utils/internal/callingx/callingx', () => ({
      endCallingxCall: jest.fn(),
      registerOutgoingCall: jest.fn(),
      joinCallingxCall: jest.fn(),
      wireAudioEngineSubscription: jest.fn(),
      unwireAudioEngineSubscription: jest.fn(),
    }));
    jest.doMock('../../src/utils/internal/registerMediaEngine', () => ({
      registerCallMediaEngine: jest.fn(),
    }));
    mod = require('../../src/modules/call-manager/CallManager');
    publicCallManager = require('../../src/modules/call-manager').callManager;
    const {
      registerSDKGlobals,
    } = require('../../src/utils/internal/registerSDKGlobals');
    // registerSDKGlobals() is a no-op once globalThis.streamRNVideoSDK is set, and that
    // global outlives jest.resetModules(). Clear it so each test binds the internal call
    // manager to its own mocked native module instead of the first test's.
    delete (globalThis as { streamRNVideoSDK?: unknown }).streamRNVideoSDK;
    registerSDKGlobals();
    internalCallManager = globalThis.streamRNVideoSDK!.callManager;
  });
  return { ...mod, publicCallManager, internalCallManager };
};

const speakerSnapshot: Snapshot = {
  endpoints: [
    { id: 'ear', name: 'Earpiece', type: 'earpiece' },
    { id: 'spk', name: 'Speaker', type: 'speaker' },
    { id: 'bt1', name: 'Sony WH', type: 'bluetooth' },
  ],
  currentEndpoint: { id: 'spk', name: 'Speaker', type: 'speaker' },
};

describe('CallManager Android Telecom branch', () => {
  afterEach(() => {
    jest.resetModules();
    delete (globalThis as any).streamRNVideoSDK;
  });

  it('adapts a callingx snapshot to AudioDevicesState', async () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx({
      getAvailableAudioEndpoints: jest.fn().mockResolvedValue(speakerSnapshot),
    });
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    const status = await new CallManager().audioDevices.getStatus();

    expect(callingx.getAvailableAudioEndpoints).toHaveBeenCalledWith('type:id');
    expect(nativeManager.getAudioDeviceStatus).not.toHaveBeenCalled();
    expect(status).toEqual({
      devices: [
        { id: 'ear', name: 'Earpiece', type: 'Earpiece' },
        { id: 'spk', name: 'Speaker', type: 'Speaker' },
        { id: 'bt1', name: 'Sony WH', type: 'Bluetooth Device' },
      ],
      selectedDeviceId: 'spk',
      currentEndpointType: 'Speaker',
    });
  });

  it('select routes via Telecom directly by endpoint id', async () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx({
      getAvailableAudioEndpoints: jest.fn().mockResolvedValue(speakerSnapshot),
    });
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    new CallManager().audioDevices.select('bt1');
    await new Promise((r) => setImmediate(r));

    expect(callingx.requestAudioEndpointChange).toHaveBeenCalledWith(
      'type:id',
      'bt1',
    );
    expect(nativeManager.chooseAudioDeviceEndpoint).not.toHaveBeenCalled();
  });

  it('setForceSpeakerphoneOn(true) routes to the speaker endpoint', async () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx({
      getAvailableAudioEndpoints: jest.fn().mockResolvedValue(speakerSnapshot),
    });
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    new CallManager().speaker.setForceSpeakerphoneOn(true);
    await new Promise((r) => setImmediate(r));

    expect(callingx.requestAudioEndpointChange).toHaveBeenCalledWith(
      'type:id',
      'spk',
    );
    expect(nativeManager.setForceSpeakerphoneOn).not.toHaveBeenCalled();
  });

  it('setForceSpeakerphoneOn(false) prefers wired > bluetooth > earpiece', async () => {
    const nativeManager = makeNativeManager();
    // No wired device present -> should pick bluetooth over earpiece.
    const callingx = makeCallingx({
      getAvailableAudioEndpoints: jest.fn().mockResolvedValue(speakerSnapshot),
    });
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    new CallManager().speaker.setForceSpeakerphoneOn(false);
    await new Promise((r) => setImmediate(r));

    expect(callingx.requestAudioEndpointChange).toHaveBeenCalledWith(
      'type:id',
      'bt1',
    );
  });

  it('start() enters telecom-managed mode and forwards the default endpoint', () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx();
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    publicCallManager.start({
      audioRole: 'communicator',
      deviceEndpointType: 'earpiece',
    });
    internalCallManager.start({ isRingingTypeCall: false, cid: 'type:id' });

    expect(callingx.setDefaultAudioDeviceEndpointType).toHaveBeenCalledWith(
      'earpiece',
    );
    expect(nativeManager.setTelecomManagedMode).toHaveBeenCalledWith(true);
    expect(nativeManager.setAudioRole).toHaveBeenCalledWith('communicator');
    expect(nativeManager.start).toHaveBeenCalled();
  });

  it('start() disables telecom-managed mode for non-telecom (classic) calls', () => {
    const nativeManager = makeNativeManager();
    // callingx present but no registered call and ongoing disabled -> classic path.
    const callingx = makeCallingx({
      hasRegisteredCall: jest.fn().mockReturnValue(false),
      isCallTracked: jest.fn().mockReturnValue(false),
      isOngoingCallsEnabled: false,
    });
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    publicCallManager.start({ audioRole: 'communicator' });
    internalCallManager.start({ isRingingTypeCall: false, cid: 'type:id' });

    expect(nativeManager.setTelecomManagedMode).toHaveBeenCalledWith(false);
    expect(nativeManager.start).toHaveBeenCalled();
  });

  it('addChangeListener subscribes to the signal-only route event and re-fetches state', async () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx({
      getAvailableAudioEndpoints: jest.fn().mockResolvedValue(speakerSnapshot),
    });
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    const onChange = jest.fn();
    new CallManager().audioDevices.addChangeListener(onChange);

    expect(callingx.addEventListener).toHaveBeenCalledWith(
      'didChangeAudioRoute',
      expect.any(Function),
    );
    // The event is signal-only: firing it re-reads the current snapshot via getStatus().
    const cb = callingx.addEventListener.mock.calls[0][1];
    cb();
    await new Promise((r) => setImmediate(r));

    expect(callingx.getAvailableAudioEndpoints).toHaveBeenCalledWith('type:id');
    expect(onChange).toHaveBeenCalledWith({
      devices: [
        { id: 'ear', name: 'Earpiece', type: 'Earpiece' },
        { id: 'spk', name: 'Speaker', type: 'Speaker' },
        { id: 'bt1', name: 'Sony WH', type: 'Bluetooth Device' },
      ],
      selectedDeviceId: 'spk',
      currentEndpointType: 'Speaker',
    });
  });
});

describe('CallManager communication-mode workaround opt-out', () => {
  afterEach(() => jest.resetModules());

  /**
   * The public call manager only records config; the SDK's internal call manager applies it
   * to native at join. Both steps are needed to exercise the opt-out plumbing.
   */
  const startCall = (
    publicCallManager: { start: (c?: any) => void },
    internalCallManager: { start: (a: any) => void },
    config?: any,
  ) => {
    publicCallManager.start(config);
    internalCallManager.start({ isRingingTypeCall: false, cid: 'type:id' });
  };

  it('start(): classic communicator call does not touch the sticky preference by default', () => {
    const nativeManager = makeNativeManager();
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx: undefined,
    });
    startCall(publicCallManager, internalCallManager, {
      audioRole: 'communicator',
    });

    expect(nativeManager.setTelecomManagedMode).toHaveBeenCalledWith(false);
    // Not forwarded unless explicitly set, so a sticky opt-out is never clobbered.
    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).not.toHaveBeenCalled();
    expect(nativeManager.start).toHaveBeenCalled();
  });

  it('start(): forwards an explicit disable=true for a classic communicator call', () => {
    const nativeManager = makeNativeManager();
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx: undefined,
    });
    startCall(publicCallManager, internalCallManager, {
      audioRole: 'communicator',
      disableCommunicationModeWorkaround: true,
    });

    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).toHaveBeenCalledWith(true);
  });

  it('start(): forwards an explicit disable=false for a classic communicator call', () => {
    const nativeManager = makeNativeManager();
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx: undefined,
    });
    startCall(publicCallManager, internalCallManager, {
      audioRole: 'communicator',
      disableCommunicationModeWorkaround: false,
    });

    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).toHaveBeenCalledWith(false);
  });

  it('start(): listener role never forwards the workaround flag', () => {
    const nativeManager = makeNativeManager();
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx: undefined,
    });
    startCall(publicCallManager, internalCallManager, {
      audioRole: 'listener',
    });

    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).not.toHaveBeenCalled();
  });

  it('start(): iOS never forwards the workaround flag', () => {
    const nativeManager = makeNativeManager();
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'ios',
      nativeManager,
      callingx: undefined,
    });
    startCall(publicCallManager, internalCallManager, {
      audioRole: 'communicator',
      disableCommunicationModeWorkaround: true,
    });

    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).not.toHaveBeenCalled();
  });

  it('start(): Telecom-managed calls never forward the workaround flag', () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx();
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    startCall(publicCallManager, internalCallManager, {
      audioRole: 'communicator',
      disableCommunicationModeWorkaround: true,
    });

    expect(nativeManager.setTelecomManagedMode).toHaveBeenCalledWith(true);
    // Telecom owns the audio mode, so the keep-alive never runs there; leave the
    // sticky preference untouched rather than letting a per-call config clobber it.
    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).not.toHaveBeenCalled();
  });

  it('setDisableCommunicationModeWorkaround: sets the sticky preference on Android', () => {
    const nativeManager = makeNativeManager();
    const { publicCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx: undefined,
    });
    publicCallManager.setDisableCommunicationModeWorkaround(true);

    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).toHaveBeenCalledWith(true);
  });

  it('setDisableCommunicationModeWorkaround: no-op on iOS', () => {
    const nativeManager = makeNativeManager();
    const { publicCallManager } = loadCallManager({
      os: 'ios',
      nativeManager,
      callingx: undefined,
    });
    publicCallManager.setDisableCommunicationModeWorkaround(true);

    expect(
      nativeManager.setDisableCommunicationModeWorkaround,
    ).not.toHaveBeenCalled();
  });

  it('start(): survives a native module missing the workaround method (version skew)', () => {
    const nativeManager = makeNativeManager();
    // Simulate an older native binary that predates the method.
    delete (nativeManager as Partial<typeof nativeManager>)
      .setDisableCommunicationModeWorkaround;
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx: undefined,
    });

    expect(() =>
      startCall(publicCallManager, internalCallManager, {
        audioRole: 'communicator',
        disableCommunicationModeWorkaround: true,
      }),
    ).not.toThrow();
    expect(nativeManager.start).toHaveBeenCalled();
  });
});
