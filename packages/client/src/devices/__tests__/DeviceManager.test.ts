/* @vitest-environment happy-dom */
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createLocalStorageMock,
  emitDeviceIds,
  LocalStorageMock,
  mockBrowserPermission,
  mockCall,
  mockDeviceIds$,
  MockTrack,
  mockVideoDevices,
  mockVideoStream,
} from './mocks';
import { DeviceManager } from '../DeviceManager';
import { DeviceManagerState } from '../DeviceManagerState';
import { firstValueFrom, of } from 'rxjs';
import { TrackType } from '../../gen/video/sfu/models/models';
import { PermissionsContext } from '../../permissions';
import { readPreferences } from '../devicePersistence';

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(function () {
      return mockCall();
    }),
  };
});

vi.mock('../../stats/ClientEventReporter', () => ({
  ClientEventReporter: vi.fn(function () {
    return {};
  }),
}));

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    getAudioBrowserPermission: () => mockBrowserPermission,
    getVideoBrowserPermission: () => mockBrowserPermission,
    deviceIds$: mockDeviceIds$(),
    resolveDeviceId: (deviceId) => deviceId,
  };
});

class TestInputMediaDeviceManagerState extends DeviceManagerState {
  public getDeviceIdFromStream = vi.fn(
    (stream) => stream.getVideoTracks()[0].getSettings().deviceId,
  );
}

class TestInputMediaDeviceManager extends DeviceManager<TestInputMediaDeviceManagerState> {
  public getDevices = vi.fn(() => of(mockVideoDevices));
  public getStream = vi.fn(() => Promise.resolve(mockVideoStream()));
  public publishStream = vi.fn();
  public stopPublishStream = vi.fn();
  public getTracks = () => this.state.mediaStream?.getTracks() ?? [];

  constructor(
    call: Call,
    devicePersistence = { enabled: false, storageKey: '' },
  ) {
    super(
      call,
      new TestInputMediaDeviceManagerState(
        'stop-tracks',
        mockBrowserPermission,
      ),
      TrackType.VIDEO,
      devicePersistence,
    );
  }
}

describe('Device Manager', () => {
  let manager: TestInputMediaDeviceManager;
  let localStorageMock: LocalStorageMock;
  let storageKey: string;

  beforeEach(() => {
    storageKey = '@test/device-preferences';
    localStorageMock = createLocalStorageMock();
    vi.spyOn(mockBrowserPermission, 'asStateObservable').mockReturnValue(
      of('granted'),
    );
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });
    manager = new TestInputMediaDeviceManager(
      new Call({
        id: '',
        type: '',
        streamClient: new StreamClient('abc123'),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
      { enabled: false, storageKey },
    );
  });

  it('list devices', () => {
    const spy = vi.fn();
    manager.listDevices().subscribe(spy);

    expect(spy).toHaveBeenCalledWith(mockVideoDevices);
  });

  it('enable device - before joined to call', async () => {
    vi.spyOn(manager, 'getStream');

    await manager.enable();

    expect(manager.getStream).toHaveBeenCalledWith({
      deviceId: undefined,
    });

    expect(manager.state.mediaStream).toBeDefined();
    expect(manager.state.status).toBe('enabled');
  });

  it('enable device - after joined to call', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);

    await manager.enable();

    expect(manager.publishStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
    );
  });

  it('enable device should set device id', async () => {
    expect(manager.state.selectedDevice).toBeUndefined();

    await manager.enable();

    expect(manager.state.selectedDevice).toBeDefined();
  });

  it('disable device - before joined to call', async () => {
    await manager.disable();

    expect(manager.state.mediaStream).toBeUndefined();
    expect(manager.state.status).toBe('disabled');
  });

  it('disable device - after joined to call', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    await manager.disable();

    expect(manager.stopPublishStream).toHaveBeenCalled();
  });

  it('disable device with forceStop', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    expect(manager.state.mediaStream).toBeDefined();

    await manager.disable(true);

    expect(manager.stopPublishStream).toHaveBeenCalled();
    expect(manager.state.mediaStream).toBeUndefined();
    expect(manager.state.status).toBe('disabled');
  });

  it('toggle device', async () => {
    vi.spyOn(manager, 'disable');
    vi.spyOn(manager, 'enable');

    await manager.toggle();

    expect(manager.enable).toHaveBeenCalled();

    await manager.toggle();

    expect(manager.disable).toHaveBeenCalled();
  });

  it('select device when status is disabled', async () => {
    const deviceId = mockVideoDevices[0].deviceId;
    await manager.select(deviceId);

    expect(manager.state.selectedDevice).toBe(deviceId);
    expect(manager.getStream).not.toHaveBeenCalledWith();
    expect(manager.publishStream).not.toHaveBeenCalled();
  });

  it('select device when status is enabled', async () => {
    await manager.enable();
    const prevStream = manager.state.mediaStream;
    vi.spyOn(prevStream!.getVideoTracks()[0], 'stop');

    const deviceId = mockVideoDevices[1].deviceId;
    await manager.select(deviceId);

    expect(prevStream!.getVideoTracks()[0].stop).toHaveBeenCalledWith();
  });

  it('select device when status is enabled and in call', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    const deviceId = mockVideoDevices[1].deviceId;
    await manager.select(deviceId);

    expect(manager.stopPublishStream).toHaveBeenCalled();
    expect(manager.getStream).toHaveBeenCalledWith({
      deviceId: { exact: deviceId },
    });
    expect(manager.publishStream).toHaveBeenCalled();
  });

  it(`changing media stream constraints shouldn't toggle optimistic status`, async () => {
    await manager.enable();
    const spy = vi.fn();
    manager.state.optimisticStatus$.subscribe(spy);

    expect(spy.mock.calls.length).toBe(1);

    const deviceId = mockVideoDevices[1].deviceId;
    await manager.select(deviceId);

    expect(spy.mock.calls.length).toBe(1);
  });

  it('should use a virtual device stream factory instead of requesting a real device stream', async () => {
    const virtualStream = mockVideoStream();
    const getUserMedia = vi.fn(() => ({ stream: virtualStream }));

    const { deviceId } = manager.registerVirtualDevice({
      label: 'Virtual camera',
      getUserMedia,
    });

    await manager.select(deviceId);
    await manager.enable();

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(getUserMedia).toHaveBeenCalledWith({
      deviceId: { exact: deviceId },
    });
    expect(manager.getStream).not.toHaveBeenCalled();
    expect(manager.state.mediaStream).toBe(virtualStream);
    expect(manager.state.selectedDevice).toBe(deviceId);
  });

  it('should call virtual device stop when switching away from it', async () => {
    const stop = vi.fn();
    const virtualStream = mockVideoStream();

    const { deviceId } = manager.registerVirtualDevice({
      label: 'Virtual camera',
      getUserMedia: vi.fn(() => ({ stream: virtualStream, stop })),
    });

    await manager.select(deviceId);
    await manager.enable();
    await manager.select(mockVideoDevices[1].deviceId);

    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('should support an async getUserMedia returning a Promise', async () => {
    const virtualStream = mockVideoStream();
    const getUserMedia = vi.fn(() =>
      Promise.resolve({ stream: virtualStream }),
    );

    const { deviceId } = manager.registerVirtualDevice({
      label: 'Async virtual camera',
      getUserMedia,
    });

    await manager.select(deviceId);
    await manager.enable();

    expect(getUserMedia).toHaveBeenCalledOnce();
    expect(manager.state.mediaStream).toBe(virtualStream);
    expect(manager.state.selectedDevice).toBe(deviceId);
  });

  it('should roll back selection when getUserMedia rejects', async () => {
    const failure = new Error('factory boom');
    const getUserMedia = vi.fn(() => Promise.reject(failure));

    await manager.enable();
    const previousDevice = manager.state.selectedDevice;

    const { deviceId } = manager.registerVirtualDevice({
      label: 'Failing camera',
      getUserMedia,
    });

    await expect(manager.select(deviceId)).rejects.toThrow(failure);

    expect(manager.state.selectedDevice).toBe(previousDevice);
  });

  it('should stop the active session and clear selection on unregister', async () => {
    const stop = vi.fn();
    const virtualStream = mockVideoStream();

    const { deviceId, unregister } = manager.registerVirtualDevice({
      label: 'Virtual camera',
      getUserMedia: vi.fn(() => ({ stream: virtualStream, stop })),
    });

    await manager.select(deviceId);
    await manager.enable();

    await unregister();

    expect(stop).toHaveBeenCalledTimes(1);
    expect(manager.state.selectedDevice).not.toBe(deviceId);
  });

  it('should remove the entry on unregister without stopping when not selected', async () => {
    const stop = vi.fn();
    const getUserMedia = vi.fn(() => ({ stream: mockVideoStream(), stop }));

    const { unregister } = manager.registerVirtualDevice({
      label: 'Unused virtual camera',
      getUserMedia,
    });

    await unregister();

    expect(stop).not.toHaveBeenCalled();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('should expose virtual devices via listDevices() with the provided label', async () => {
    manager.registerVirtualDevice({
      label: 'My virtual camera',
      getUserMedia: vi.fn(() => ({ stream: mockVideoStream() })),
    });

    const devices = await firstValueFrom(manager.listDevices());

    expect(devices.length).toBe(mockVideoDevices.length + 1);
    const virtual = devices.find((d) => d.label === 'My virtual camera');
    expect(virtual).toBeDefined();
    expect(virtual?.kind).toBe('videoinput');
  });

  it('should resume previously enabled state', async () => {
    vi.spyOn(manager, 'enable');

    await manager.enable();

    expect(manager.enable).toHaveBeenCalledTimes(1);

    await manager.disable();
    await manager.resume();

    expect(manager.enable).toHaveBeenCalledTimes(2);
  });

  it(`shouldn't resume if previous state is disabled`, async () => {
    vi.spyOn(manager, 'enable');

    await manager.disable();

    expect(manager.enable).not.toHaveBeenCalled();

    await manager.resume();

    expect(manager.enable).not.toHaveBeenCalled();
  });

  it(`shouldn't resume if it were disabled while in pause`, async () => {
    vi.spyOn(manager, 'enable');

    await manager.enable();

    expect(manager.enable).toHaveBeenCalledOnce();

    // first call is pause
    await manager.disable();
    // second call is for example mute from call admin
    await manager.disable();

    await manager.resume();

    expect(manager.enable).toHaveBeenCalledOnce();
  });

  it(`should resume if enable was cancelled due to disable call`, async () => {
    vi.spyOn(manager, 'enable');

    manager.enable();

    expect(manager.enable).toHaveBeenCalledOnce();

    // enable was not awaited so cancelled by disabled
    await manager.disable();

    manager.resume();

    expect(manager.enable).toBeCalledTimes(2);

    // this disable is not awaited, but will cancel the enable anyway
    // so resume must work here too
    manager.disable();

    manager.resume();

    expect(manager.enable).toBeCalledTimes(3);
  });

  it('should provide default constraints to `getStream` method', () => {
    manager.setDefaultConstraints({
      echoCancellation: true,
      autoGainControl: false,
    });

    manager.enable();

    expect(manager.getStream).toHaveBeenCalledWith({
      deviceId: undefined,
      echoCancellation: true,
      autoGainControl: false,
    });
  });

  it('should set status to disabled if track ends', async () => {
    vi.useFakeTimers();

    await manager.enable();

    vi.spyOn(manager, 'enable');
    vi.spyOn(manager, 'listDevices').mockImplementationOnce(() =>
      of(mockVideoDevices.slice(1)),
    );
    await (
      (manager.state.mediaStream?.getTracks()[0] as MockTrack).eventHandlers[
        'ended'
      ] as Function
    )();
    await vi.runAllTimersAsync();

    expect(manager.state.status).toBe('disabled');
    expect(manager.enable).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('should restart track if the default device is replaced and status is enabled', async () => {
    vi.useFakeTimers();
    emitDeviceIds(mockVideoDevices);

    await manager.enable();
    const device = mockVideoDevices[0];
    await manager.select(device.deviceId);

    // @ts-expect-error - private method
    vi.spyOn(manager, 'applySettingsToStream');

    emitDeviceIds([
      { ...device, groupId: device.groupId + 'new' },
      ...mockVideoDevices.slice(1),
    ]);

    await vi.runAllTimersAsync();

    expect(manager['applySettingsToStream']).toHaveBeenCalledOnce();
    expect(manager.state.status).toBe('enabled');

    vi.useRealTimers();
  });

  it('should do nothing if default device is replaced and status is disabled', async () => {
    vi.useFakeTimers();
    emitDeviceIds(mockVideoDevices);

    const device = mockVideoDevices[0];
    await manager.select(device.deviceId);
    await manager.disable();

    emitDeviceIds([
      { ...device, groupId: device.groupId + 'new' },
      ...mockVideoDevices.slice(1),
    ]);

    await vi.runAllTimersAsync();

    expect(manager.state.status).toBe('disabled');
    expect(manager.state.optimisticStatus).toBe('disabled');
    expect(manager.state.selectedDevice).toBe(device.deviceId);

    vi.useRealTimers();
  });

  it('should disable stream and deselect device if selected device is disconnected', async () => {
    vi.useFakeTimers();
    emitDeviceIds(mockVideoDevices);

    await manager.enable();
    const device = mockVideoDevices[0];
    await manager.select(device.deviceId);

    emitDeviceIds(mockVideoDevices.slice(1));

    await vi.runAllTimersAsync();

    expect(manager.state.selectedDevice).toBe(undefined);
    expect(manager.state.status).toBe('disabled');
    expect(manager['call'].streamClient.dispatchEvent).toHaveBeenCalledWith({
      type: 'device.disconnected',
      call_cid: manager['call'].cid,
      status: 'enabled',
      deviceId: device.deviceId,
      label: device.label,
      kind: device.kind,
    });

    vi.useRealTimers();
  });

  describe('interruptedTracks (hardware mute/unmute events)', () => {
    const localSessionId = 'local-session-id';

    beforeEach(() => {
      manager['call'].state.setParticipants([
        {
          sessionId: localSessionId,
          userId: 'local-user',
          isLocalParticipant: true,
          publishedTracks: [],
        } as any,
      ]);
    });

    const fireOn = async (track: MockTrack, event: 'mute' | 'unmute') => {
      const handler = track.eventHandlers[event] as Function;
      await handler();
    };

    const currentTrack = () =>
      manager.state.mediaStream?.getTracks()[0] as MockTrack;

    const isInterrupted = () =>
      !!manager['call'].state.localParticipant?.interruptedTracks?.includes(
        TrackType.VIDEO,
      );

    it('adds the track type on a mute event without touching status', async () => {
      await manager.enable();
      expect(manager.state.status).toBe('enabled');
      expect(isInterrupted()).toBe(false);

      await fireOn(currentTrack(), 'mute');

      expect(isInterrupted()).toBe(true);
      expect(manager.state.status).toBe('enabled');
      expect(manager.state.optimisticStatus).toBe('enabled');
    });

    it('removes the track type on the matching unmute event', async () => {
      await manager.enable();
      const track = currentTrack();
      await fireOn(track, 'mute');
      expect(isInterrupted()).toBe(true);

      await fireOn(track, 'unmute');

      expect(isInterrupted()).toBe(false);
      expect(manager.state.status).toBe('enabled');
    });

    it('notifies the SFU for video track mute/unmute events', async () => {
      await manager.enable();
      const track = currentTrack();

      await fireOn(track, 'mute');
      expect(manager['call'].notifyTrackMuteState).toHaveBeenCalledWith(
        true,
        TrackType.VIDEO,
      );

      await fireOn(track, 'unmute');
      expect(manager['call'].notifyTrackMuteState).toHaveBeenCalledWith(
        false,
        TrackType.VIDEO,
      );
    });

    it('emits localParticipant$ transitions to subscribers', async () => {
      const observed: boolean[] = [];
      const subscription = manager['call'].state.localParticipant$.subscribe(
        (p) => observed.push(!!p?.interruptedTracks?.includes(TrackType.VIDEO)),
      );

      await manager.enable();
      const track = currentTrack();
      await fireOn(track, 'mute');
      await fireOn(track, 'unmute');

      expect(observed).toContain(true);
      expect(observed[observed.length - 1]).toBe(false);
      subscription.unsubscribe();
    });

    it('reacquires a fresh stream when the device is replaced mid-interruption', async () => {
      vi.useFakeTimers();
      emitDeviceIds(mockVideoDevices);

      await manager.enable();
      const device = mockVideoDevices[0];
      await manager.select(device.deviceId);
      await fireOn(currentTrack(), 'mute');
      expect(isInterrupted()).toBe(true);
      expect(manager.state.status).toBe('enabled');

      manager.getStream.mockClear();

      emitDeviceIds([
        { ...device, groupId: device.groupId + 'new' },
        ...mockVideoDevices.slice(1),
      ]);

      await vi.runAllTimersAsync();

      // Status stays 'enabled' so the replacement flows through
      // applySettingsToStream, which forces a fresh getStream call.
      expect(manager.getStream).toHaveBeenCalled();
      expect(manager.state.status).toBe('enabled');
      vi.useRealTimers();
    });

    it('leaves manager.enabled === true so capability cleanup can still disable it', async () => {
      await manager.enable();
      await fireOn(currentTrack(), 'mute');

      // `enabled` continues to reflect requested-publishing intent. Code
      // that revokes SEND_AUDIO / SEND_VIDEO at the Call layer iterates
      // managers whose `enabled` is true; if system-muted hid that bit,
      // the cleanup would skip a still-published track.
      expect(manager.enabled).toBe(true);
    });

    it('clears interruptedTracks when the user toggles the device off and back on', async () => {
      await manager.enable();
      await fireOn(currentTrack(), 'mute');
      expect(isInterrupted()).toBe(true);

      await manager.disable();
      // Stream is cleared on disable; the prior hardware-mute signal
      // belonged to the now-gone track.
      expect(isInterrupted()).toBe(false);

      await manager.enable();
      // Re-acquired stream is fresh; the stale flag must not carry over.
      expect(isInterrupted()).toBe(false);
    });

    it('clears interruptedTracks when select() swaps to a different device', async () => {
      await manager.enable();
      await fireOn(currentTrack(), 'mute');
      expect(isInterrupted()).toBe(true);

      await manager.select(mockVideoDevices[1].deviceId);

      expect(isInterrupted()).toBe(false);
    });

    it('removes mute/unmute listeners from the prior track when select() swaps the stream', async () => {
      await manager.enable();
      const oldTrack = currentTrack();
      expect(oldTrack.eventHandlers['mute']).toBeDefined();
      expect(oldTrack.eventHandlers['unmute']).toBeDefined();

      await manager.select(mockVideoDevices[1].deviceId);

      // Listeners on the prior track are torn down so a delayed
      // mute/unmute event cannot clobber the fresh stream's state.
      expect(oldTrack.eventHandlers['mute']).toBeUndefined();
      expect(oldTrack.eventHandlers['unmute']).toBeUndefined();
      expect(oldTrack.eventHandlers['ended']).toBeUndefined();
    });

    it('removes mute/unmute listeners when the stream is cleared on disable', async () => {
      await manager.enable();
      const oldTrack = currentTrack();
      expect(oldTrack.eventHandlers['mute']).toBeDefined();

      await manager.disable();

      expect(oldTrack.eventHandlers['mute']).toBeUndefined();
      expect(oldTrack.eventHandlers['unmute']).toBeUndefined();
      expect(oldTrack.eventHandlers['ended']).toBeUndefined();
    });

    describe('WebKit refreshTrack on unmute (encoder stall workaround)', () => {
      const SAFARI_UA =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15';
      const IOS_WKWEBVIEW_UA =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148';
      const CHROME_UA =
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

      const originalUserAgentDescriptor = Object.getOwnPropertyDescriptor(
        window.navigator,
        'userAgent',
      );

      const setUserAgent = (ua: string) => {
        Object.defineProperty(window.navigator, 'userAgent', {
          configurable: true,
          get: () => ua,
        });
      };

      afterEach(() => {
        if (originalUserAgentDescriptor) {
          Object.defineProperty(
            window.navigator,
            'userAgent',
            originalUserAgentDescriptor,
          );
        }
      });

      it('calls refreshPublishedTrack on Safari unmute', async () => {
        setUserAgent(SAFARI_UA);
        await manager.enable();
        const track = currentTrack();
        await fireOn(track, 'mute');

        await fireOn(track, 'unmute');

        expect(manager['call'].refreshPublishedTrack).toHaveBeenCalledWith(
          TrackType.VIDEO,
        );
      });

      it('calls refreshPublishedTrack on a bare iOS WKWebView (no Safari token)', async () => {
        setUserAgent(IOS_WKWEBVIEW_UA);
        await manager.enable();
        const track = currentTrack();
        await fireOn(track, 'mute');

        await fireOn(track, 'unmute');

        expect(manager['call'].refreshPublishedTrack).toHaveBeenCalledWith(
          TrackType.VIDEO,
        );
      });

      it('does not call refreshPublishedTrack on Chrome unmute', async () => {
        setUserAgent(CHROME_UA);
        await manager.enable();
        const track = currentTrack();
        await fireOn(track, 'mute');

        await fireOn(track, 'unmute');

        expect(manager['call'].refreshPublishedTrack).not.toHaveBeenCalled();
      });

      it('does not call refreshPublishedTrack on the mute leg', async () => {
        setUserAgent(SAFARI_UA);
        await manager.enable();
        const track = currentTrack();

        await fireOn(track, 'mute');

        expect(manager['call'].refreshPublishedTrack).not.toHaveBeenCalled();
      });

      it('skips refreshPublishedTrack while the page is hidden', async () => {
        setUserAgent(SAFARI_UA);
        const visibilityDescriptor = Object.getOwnPropertyDescriptor(
          document,
          'visibilityState',
        );
        Object.defineProperty(document, 'visibilityState', {
          configurable: true,
          get: () => 'hidden',
        });

        try {
          await manager.enable();
          const track = currentTrack();
          await fireOn(track, 'mute');

          await fireOn(track, 'unmute');

          expect(manager['call'].refreshPublishedTrack).not.toHaveBeenCalled();
        } finally {
          if (visibilityDescriptor) {
            Object.defineProperty(
              document,
              'visibilityState',
              visibilityDescriptor,
            );
          }
        }
      });
    });
  });

  describe('persistPreference', () => {
    it('stores selected device and muted state', () => {
      const persistenceEnabledManager = new TestInputMediaDeviceManager(
        manager['call'],
        { enabled: true, storageKey },
      );
      persistenceEnabledManager.state.setDevice(mockVideoDevices[1].deviceId);
      persistenceEnabledManager.state.setStatus('enabled');

      const preferences = readPreferences(storageKey);
      expect(preferences.camera).toEqual([
        {
          selectedDeviceId: mockVideoDevices[1].deviceId,
          selectedDeviceLabel: mockVideoDevices[1].label,
          muted: false,
        },
      ]);
    });

    it('stores default device when selection is cleared', () => {
      const persistenceEnabledManager = new TestInputMediaDeviceManager(
        manager['call'],
        { enabled: true, storageKey },
      );
      persistenceEnabledManager.state.setDevice(undefined);
      persistenceEnabledManager.state.setStatus('disabled');

      const preferences = readPreferences(storageKey);
      expect(preferences.camera).toEqual([
        {
          selectedDeviceId: 'default',
          selectedDeviceLabel: '',
          muted: true,
        },
      ]);
    });

    it('persists device history when selection changes', () => {
      const persistenceEnabledManager = new TestInputMediaDeviceManager(
        manager['call'],
        { enabled: true, storageKey },
      );

      persistenceEnabledManager.state.setDevice(mockVideoDevices[0].deviceId);
      persistenceEnabledManager.state.setStatus('enabled');

      persistenceEnabledManager.state.setDevice(mockVideoDevices[1].deviceId);
      persistenceEnabledManager.state.setStatus('enabled');

      const preferences = readPreferences(storageKey);
      expect(preferences.camera).toEqual([
        {
          selectedDeviceId: mockVideoDevices[1].deviceId,
          selectedDeviceLabel: mockVideoDevices[1].label,
          muted: false,
        },
        {
          selectedDeviceId: mockVideoDevices[0].deviceId,
          selectedDeviceLabel: mockVideoDevices[0].label,
          muted: false,
        },
      ]);
    });

    it('stores preferences when permission is granted', async () => {
      const persistenceEnabledManager = new TestInputMediaDeviceManager(
        manager['call'],
        { enabled: true, storageKey },
      );
      const listDevicesSpy = vi.spyOn(persistenceEnabledManager, 'listDevices');

      emitDeviceIds(mockVideoDevices);
      persistenceEnabledManager.state.setDevice(mockVideoDevices[0].deviceId);
      persistenceEnabledManager.state.setStatus('enabled');

      expect(readPreferences(storageKey).camera).toBeDefined();
      expect(listDevicesSpy).toHaveBeenCalled();
      expect(readPreferences(storageKey).camera).toEqual([
        {
          selectedDeviceId: mockVideoDevices[0].deviceId,
          selectedDeviceLabel: mockVideoDevices[0].label,
          muted: false,
        },
      ]);
    });

    it('does not store preferences when permission is not granted', async () => {
      vi.spyOn(mockBrowserPermission, 'asStateObservable').mockReturnValue(
        of('prompt'),
      );
      const persistenceEnabledManager = new TestInputMediaDeviceManager(
        manager['call'],
        { enabled: true, storageKey },
      );
      const listDevicesSpy = vi.spyOn(persistenceEnabledManager, 'listDevices');

      emitDeviceIds(mockVideoDevices);
      persistenceEnabledManager.state.setDevice(mockVideoDevices[0].deviceId);
      persistenceEnabledManager.state.setStatus('enabled');

      expect(readPreferences(storageKey).camera).toBeUndefined();
      expect(listDevicesSpy).not.toHaveBeenCalled();
    });

    it('does not overwrite preferences when track ends unexpectedly', async () => {
      const persistenceEnabledManager = new TestInputMediaDeviceManager(
        manager['call'],
        { enabled: true, storageKey },
      );

      await persistenceEnabledManager.enable();

      expect(readPreferences(storageKey).camera).toEqual([
        {
          selectedDeviceId: mockVideoDevices[0].deviceId,
          selectedDeviceLabel: mockVideoDevices[0].label,
          muted: false,
        },
      ]);

      const [track] = persistenceEnabledManager.state.mediaStream!.getTracks();
      await ((track as MockTrack).eventHandlers['ended'] as Function)();

      expect(readPreferences(storageKey).camera).toEqual([
        {
          selectedDeviceId: mockVideoDevices[0].deviceId,
          selectedDeviceLabel: mockVideoDevices[0].label,
          muted: false,
        },
      ]);
    });
  });

  describe('applyPersistedPreferences', () => {
    beforeEach(() => {
      manager.dispose();
      manager = new TestInputMediaDeviceManager(manager['call'], {
        enabled: true,
        storageKey,
      });
      // @ts-expect-error - read only property
      manager['call'].permissionsContext = new PermissionsContext();
      manager['call'].permissionsContext.canPublish = vi
        .fn()
        .mockReturnValue(true);
    });

    it('returns false when no preferences exist', async () => {
      // @ts-expect-error - private api
      const result = await manager.applyPersistedPreferences(true);
      expect(result).toBe(false);
    });

    it('selects device by id and applies muted state', async () => {
      localStorageMock.setItem(
        storageKey,
        JSON.stringify({
          camera: [
            {
              selectedDeviceId: mockVideoDevices[0].deviceId,
              selectedDeviceLabel: mockVideoDevices[0].label,
              muted: true,
            },
          ],
        }),
      );

      const selectSpy = vi.spyOn(manager, 'select');
      const disableSpy = vi.spyOn(manager, 'disable');

      // @ts-expect-error - private API
      const result = await manager.applyPersistedPreferences(true);

      expect(result).toBe(true);
      expect(selectSpy).toHaveBeenCalledWith(mockVideoDevices[0].deviceId);
      expect(disableSpy).toHaveBeenCalled();
    });

    it('selects device by label when device id is not found', async () => {
      localStorageMock.setItem(
        storageKey,
        JSON.stringify({
          camera: [
            {
              selectedDeviceId: 'missing-device',
              selectedDeviceLabel: mockVideoDevices[1].label,
              muted: false,
            },
          ],
        }),
      );

      const selectSpy = vi.spyOn(manager, 'select');

      // @ts-expect-error private api
      const result = await manager.applyPersistedPreferences(true);

      expect(result).toBe(true);
      expect(selectSpy).toHaveBeenCalledWith(mockVideoDevices[1].deviceId);
    });

    it('applies muted state without selecting when default device is stored', async () => {
      localStorageMock.setItem(
        storageKey,
        JSON.stringify({
          camera: [
            {
              selectedDeviceId: 'default',
              selectedDeviceLabel: '',
              muted: true,
            },
          ],
        }),
      );

      const selectSpy = vi.spyOn(manager, 'select');
      const disableSpy = vi.spyOn(manager, 'disable');

      // @ts-expect-error private api
      const result = await manager.applyPersistedPreferences(true);

      expect(result).toBe(true);
      expect(selectSpy).not.toHaveBeenCalled();
      expect(disableSpy).toHaveBeenCalled();
    });
  });

  afterEach(() => {
    manager.dispose();
    vi.clearAllMocks();
    vi.resetModules();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: undefined,
    });
  });
});
