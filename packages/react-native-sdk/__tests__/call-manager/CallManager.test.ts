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
  jest.isolateModules(() => {
    jest.doMock('react-native', () => ({
      Platform: { OS: os, select: (o: any) => o[os] },
      NativeModules: { StreamInCallManager: nativeManager },
      NativeEventEmitter: class {
        addListener() {
          return { remove: jest.fn() };
        }
      },
    }));
    jest.doMock('../../src/utils/push/libs/callingx', () => ({
      getCallingxLibIfAvailable: () => callingx,
    }));
    mod = require('../../src/modules/call-manager/CallManager');
  });
  return mod;
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
  afterEach(() => jest.resetModules());

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
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    new CallManager().start({
      audioRole: 'communicator',
      deviceEndpointType: 'earpiece',
    });

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
      isOngoingCallsEnabled: false,
    });
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    new CallManager().start({ audioRole: 'communicator' });

    expect(nativeManager.setTelecomManagedMode).toHaveBeenCalledWith(false);
    expect(nativeManager.start).toHaveBeenCalled();
  });

  it('addChangeListener uses callingx events when telecom-managed', () => {
    const nativeManager = makeNativeManager();
    const callingx = makeCallingx();
    const { CallManager } = loadCallManager({
      os: 'android',
      nativeManager,
      callingx,
    });
    const onChange = jest.fn();
    new CallManager().audioDevices.addChangeListener(onChange);

    expect(callingx.addEventListener).toHaveBeenCalledWith(
      'didChangeAudioEndpoints',
      expect.any(Function),
    );
    // Simulate a native event and assert adaptation.
    const cb = callingx.addEventListener.mock.calls[0][1];
    cb({ callId: 'type:id', ...speakerSnapshot });
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
