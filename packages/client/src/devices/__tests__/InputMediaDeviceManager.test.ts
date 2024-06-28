import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MockTrack,
  emitDeviceIds,
  mockBrowserPermission,
  mockCall,
  mockDeviceIds$,
  mockVideoDevices,
  mockVideoStream,
} from './mocks';
import { InputMediaDeviceManager } from '../InputMediaDeviceManager';
import { InputMediaDeviceManagerState } from '../InputMediaDeviceManagerState';
import { of } from 'rxjs';
import { TrackType } from '../../gen/video/sfu/models/models';

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    getAudioBrowserPermission: () => mockBrowserPermission,
    getVideoBrowserPermission: () => mockBrowserPermission,
    deviceIds$: mockDeviceIds$(),
  };
});

class TestInputMediaDeviceManagerState extends InputMediaDeviceManagerState {
  public getDeviceIdFromStream = vi.fn(
    (stream) => stream.getVideoTracks()[0].getSettings().deviceId,
  );
}

class TestInputMediaDeviceManager extends InputMediaDeviceManager<TestInputMediaDeviceManagerState> {
  public getDevices = vi.fn(() => of(mockVideoDevices));
  public getStream = vi.fn(() => Promise.resolve(mockVideoStream()));
  public publishStream = vi.fn();
  public stopPublishStream = vi.fn();
  public getTracks = () => this.state.mediaStream?.getTracks() ?? [];

  constructor(call: Call) {
    super(
      call,
      new TestInputMediaDeviceManagerState(
        'stop-tracks',
        mockBrowserPermission,
      ),
      TrackType.VIDEO,
    );
  }
}

describe('InputMediaDeviceManager.test', () => {
  let manager: TestInputMediaDeviceManager;

  beforeEach(() => {
    manager = new TestInputMediaDeviceManager(
      new Call({
        id: '',
        type: '',
        streamClient: new StreamClient('abc123'),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
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

    expect(manager.stopPublishStream).toHaveBeenCalledWith(true);
  });

  it('disable device with forceStop', async () => {
    manager['call'].state.setCallingState(CallingState.JOINED);
    await manager.enable();

    expect(manager.state.mediaStream).toBeDefined();

    await manager.disable(true);

    expect(manager.stopPublishStream).toHaveBeenCalledWith(true);
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

    expect(manager.stopPublishStream).toHaveBeenCalledWith(true);
    expect(manager.getStream).toHaveBeenCalledWith({
      deviceId,
    });
    expect(manager.publishStream).toHaveBeenCalled();
  });

  it(`changing media stream constraints shouldn't toggle status`, async () => {
    await manager.enable();
    const spy = vi.fn();
    manager.state.status$.subscribe(spy);

    expect(spy.mock.calls.length).toBe(1);

    const deviceId = mockVideoDevices[1].deviceId;
    await manager.select(deviceId);

    expect(spy.mock.calls.length).toBe(1);
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

    //@ts-expect-error
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

    vi.useRealTimers();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
