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
  setEnableStereoAudioOutput: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
  stopSound: jest.fn(),
  chooseAudioDeviceEndpoint: jest.fn(),
  getAudioDeviceStatus: jest.fn(),
  setForceSpeakerphoneOn: jest.fn(),
  reapplyAudioRoute: jest.fn(),
  onAudioDeviceChanged: jest.fn().mockReturnValue({ remove: jest.fn() }),
  onAudioInterruption: jest.fn().mockReturnValue({ remove: jest.fn() }),
});

const makeCallingx = (overrides: Partial<any> = {}) => ({
  isSetup: true,
  isTelecomBacked: true,
  isOngoingCallsEnabled: false,
  hasRegisteredCall: jest.fn().mockReturnValue(true),
  isCallTracked: jest.fn().mockReturnValue(true),
  getRegisteredCallIds: jest.fn().mockReturnValue(['type:id']),
  getAvailableAudioEndpoints: jest.fn(),
  requestAudioEndpointChange: jest.fn(),
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
    }));
    jest.doMock('../../src/native/NativeStreamInCallManager', () => ({
      __esModule: true,
      default: nativeManager,
    }));
    jest.doMock('../../src/utils/push/libs/callingx', () => ({
      getCallingxLibIfAvailable: () => callingx,
    }));
    jest.doMock('../../src/utils/internal/callingx/callingx', () => ({
      endCallingxCall: jest.fn(),
      registerOutgoingCall: jest.fn(),
      joinCallingxCall: jest.fn(),
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
      getAvailableAudioEndpoints: jest.fn().mockReturnValue(speakerSnapshot),
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
      getAvailableAudioEndpoints: jest.fn().mockReturnValue(speakerSnapshot),
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
      getAvailableAudioEndpoints: jest.fn().mockReturnValue(speakerSnapshot),
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
      getAvailableAudioEndpoints: jest.fn().mockReturnValue(speakerSnapshot),
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
    internalCallManager.start({
      isRingingTypeCall: false,
      cid: 'type:id',
      defaultDevice: 'speaker',
    });

    // the stored override wins over the settings-derived default, sent once, to callingx only
    expect(callingx.setDefaultAudioDeviceEndpointType).toHaveBeenCalledTimes(1);
    expect(callingx.setDefaultAudioDeviceEndpointType).toHaveBeenCalledWith(
      'earpiece',
    );
    expect(
      nativeManager.setDefaultAudioDeviceEndpointType,
    ).not.toHaveBeenCalled();
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
    internalCallManager.start({
      isRingingTypeCall: false,
      cid: 'type:id',
      defaultDevice: 'earpiece',
    });

    expect(nativeManager.setTelecomManagedMode).toHaveBeenCalledWith(false);
    // no override stored: the settings-derived default goes to the native manager, before start
    expect(
      nativeManager.setDefaultAudioDeviceEndpointType,
    ).toHaveBeenCalledTimes(1);
    expect(
      nativeManager.setDefaultAudioDeviceEndpointType,
    ).toHaveBeenCalledWith('earpiece');
    expect(callingx.setDefaultAudioDeviceEndpointType).not.toHaveBeenCalled();
    const [deviceOrder] =
      nativeManager.setDefaultAudioDeviceEndpointType.mock.invocationCallOrder;
    const [startOrder] = nativeManager.start.mock.invocationCallOrder;
    expect(deviceOrder).toBeLessThan(startOrder!);
    expect(nativeManager.start).toHaveBeenCalled();
  });

  it('start() sends the settings default to the native manager for a listener call (override ignored)', () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx({
      hasRegisteredCall: jest.fn().mockReturnValue(false),
      isCallTracked: jest.fn().mockReturnValue(false),
    });
    const { publicCallManager, internalCallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    publicCallManager.start({ audioRole: 'listener' });
    internalCallManager.start({
      isRingingTypeCall: false,
      cid: 'type:id',
      defaultDevice: 'speaker',
    });

    expect(nativeManager.setAudioRole).toHaveBeenCalledWith('listener');
    expect(
      nativeManager.setDefaultAudioDeviceEndpointType,
    ).toHaveBeenCalledWith('speaker');
    expect(nativeManager.setEnableStereoAudioOutput).toHaveBeenCalledWith(true);
    expect(nativeManager.start).toHaveBeenCalled();
  });

  it('addChangeListener subscribes to the signal-only route event and re-fetches state', async () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx({
      getAvailableAudioEndpoints: jest.fn().mockReturnValue(speakerSnapshot),
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

describe('CallManager native events (StreamInCallManager TurboModule)', () => {
  afterEach(() => {
    jest.resetModules();
    delete (globalThis as any).streamRNVideoSDK;
  });

  it('addChangeListener subscribes to onAudioDeviceChanged and removes it on cleanup', () => {
    const nativeManager = makeNativeManager();
    const remove = jest.fn();
    nativeManager.onAudioDeviceChanged.mockReturnValue({ remove });
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx: undefined,
    });
    const onChange = jest.fn();
    const unsubscribe = new CallManager().audioDevices.addChangeListener(
      onChange,
    );

    expect(nativeManager.onAudioDeviceChanged).toHaveBeenCalledTimes(1);
    const state = { devices: [], currentEndpointType: 'Speaker' };
    nativeManager.onAudioDeviceChanged.mock.calls[0][0](state);
    expect(onChange).toHaveBeenCalledWith(state);

    expect(remove).not.toHaveBeenCalled();
    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });

  it('addAudioInterruptionListener subscribes to onAudioInterruption and removes it on cleanup (iOS)', () => {
    const nativeManager = makeNativeManager();
    const remove = jest.fn();
    nativeManager.onAudioInterruption.mockReturnValue({ remove });
    const { CallManager } = loadCallManager({
      os: 'ios',
      nativeManager,
      callingx: undefined,
    });
    const onInterruption = jest.fn();
    const unsubscribe = new CallManager().ios.addAudioInterruptionListener(
      onInterruption,
    );

    const event = { source: 'callmanager', phase: 'began' };
    nativeManager.onAudioInterruption.mock.calls[0][0](event);
    expect(onInterruption).toHaveBeenCalledWith(event);

    unsubscribe();
    expect(remove).toHaveBeenCalledTimes(1);
  });
});

describe('internal callManager.start on iOS', () => {
  afterEach(() => {
    jest.resetModules();
    delete (globalThis as any).streamRNVideoSDK;
  });

  it('starts the native manager with the settings default (no callingx)', () => {
    const nativeManager = makeNativeManager();
    const { internalCallManager } = loadCallManager({
      os: 'ios',
      nativeManager,
      callingx: undefined,
    });

    internalCallManager.start({
      isRingingTypeCall: false,
      cid: 'type:id',
      defaultDevice: 'earpiece',
    });

    expect(nativeManager.stopSound).toHaveBeenCalledTimes(1);
    expect(
      nativeManager.setDefaultAudioDeviceEndpointType,
    ).toHaveBeenCalledWith('earpiece');
    expect(nativeManager.setTelecomManagedMode).not.toHaveBeenCalled();
    expect(nativeManager.setEnableStereoAudioOutput).toHaveBeenCalledWith(
      false,
    );
    expect(nativeManager.start).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['the settings default', undefined, 'earpiece'],
    ['the stored override', 'speaker', 'speaker'],
  ] as const)(
    'forwards %s to callingx only when callingx owns the session',
    (_, override, expected) => {
      const nativeManager = makeNativeManager();
      const callingx = makeCallingx({ isOngoingCallsEnabled: true });
      const { publicCallManager, internalCallManager } = loadCallManager({
        os: 'ios',
        nativeManager,
        callingx,
      });
      if (override) {
        publicCallManager.start({
          audioRole: 'communicator',
          deviceEndpointType: override,
        });
      }

      internalCallManager.start({
        isRingingTypeCall: false,
        cid: 'type:id',
        defaultDevice: 'earpiece',
      });

      expect(callingx.setDefaultAudioDeviceEndpointType).toHaveBeenCalledTimes(
        1,
      );
      expect(callingx.setDefaultAudioDeviceEndpointType).toHaveBeenCalledWith(
        expected,
      );
      expect(
        nativeManager.setDefaultAudioDeviceEndpointType,
      ).not.toHaveBeenCalled();
      expect(nativeManager.setAudioRole).not.toHaveBeenCalled();
      expect(nativeManager.setEnableStereoAudioOutput).not.toHaveBeenCalled();
      expect(nativeManager.start).not.toHaveBeenCalled();
    },
  );
});
