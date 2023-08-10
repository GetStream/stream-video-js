import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, vi, it, expect, Mock } from 'vitest';
import { mockCall, mockVideoDevices, mockVideoStream } from './mocks';
import { InputMediaDeviceManager } from '../InputMediaDeviceManager';
import { InputMediaDeviceManagerState } from '../InputMediaDeviceManagerState';
import { of } from 'rxjs';

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

class TestInputMediaDeviceManagerState extends InputMediaDeviceManagerState {
  public getDeviceIdFromStream = vi.fn(() => 'mock-device-id');
}

class TestInputMediaDeviceManager extends InputMediaDeviceManager<TestInputMediaDeviceManagerState> {
  public getDevices = vi.fn(() => of(mockVideoDevices));
  public getStream = vi.fn(() => Promise.resolve(mockVideoStream()));
  public publishStream = vi.fn();
  public stopPublishStream = vi.fn();

  constructor(call: Call) {
    super(call, new TestInputMediaDeviceManagerState());
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
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;

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

  it('disable camera - after joined to call', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    await manager.enable();

    await manager.disable();

    expect(manager.stopPublishStream).toHaveBeenCalledWith();
  });

  it('toggle device', async () => {
    vi.spyOn(manager, 'disable');
    vi.spyOn(manager, 'enable');

    manager.state.setMediaStream(undefined);
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

  it('select device when status is enabled and in call', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    await manager.enable();

    const deviceId = mockVideoDevices[1].deviceId;
    await manager.select(deviceId);

    expect(manager.stopPublishStream).toHaveBeenCalledWith();
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

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
