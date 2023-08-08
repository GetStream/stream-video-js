import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, vi, it, expect } from 'vitest';
import { mockCall, mockVideoDevices, mockVideoStream } from './mocks';
import { getVideoStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { CameraManager } from '../CameraManager';
import { of } from 'rxjs';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getVideoDevices: vi.fn(() => {
      return of(mockVideoDevices);
    }),
    getVideoStream: vi.fn(() => Promise.resolve(mockVideoStream())),
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

describe('CameraManager', () => {
  let manager: CameraManager;

  beforeEach(() => {
    manager = new CameraManager(
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

  it('enable camera - before joined to call', async () => {
    await manager.enable();

    expect(getVideoStream).toHaveBeenCalledWith({
      deviceId: undefined,
      facingMode: 'user',
    });
    expect(manager.state.mediaStream).toBeDefined();
    expect(manager.state.status).toBe('enabled');
  });

  it('enable camera - after joined to call', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;

    await manager.enable();

    expect(manager['call'].publishVideoStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
    );
  });

  it('enable camera should set device id', async () => {
    expect(manager.state.selectedDevice).toBeUndefined();

    await manager.enable();

    expect(manager.state.selectedDevice).toBeDefined();
  });

  it('disable camera - before joined to call', async () => {
    await manager.disable();

    expect(manager.state.mediaStream).toBeUndefined();
    expect(manager.state.status).toBe('disabled');
  });

  it('disable camera - after joined to call', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    // @ts-expect-error
    manager.state.setMediaStream(mockVideoStream());

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.VIDEO);
  });

  it('toggle camera', async () => {
    vi.spyOn(manager, 'disable');
    vi.spyOn(manager, 'enable');

    manager.state.setMediaStream(undefined);
    await manager.toggle();

    expect(manager.enable).toHaveBeenCalled();

    await manager.toggle();

    expect(manager.disable).toHaveBeenCalled();
  });

  it('select device when camera is off', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    manager.state.setMediaStream(undefined);
    manager.state.setDevice(undefined);

    const deviceId = mockVideoDevices[0].deviceId;
    await manager.select(deviceId);

    expect(manager.state.selectedDevice).toBe(deviceId);
    expect(getVideoStream).not.toHaveBeenCalledWith();
    expect(manager['call'].publishVideoStream).not.toHaveBeenCalled();
  });

  it('select device when camera is on', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    // @ts-expect-error
    manager.state.setMediaStream(mockVideoStream());
    manager.state.setDevice(undefined);

    const deviceId = mockVideoDevices[0].deviceId;
    await manager.select(deviceId);

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.VIDEO);
    expect(manager['call'].publishVideoStream).toHaveBeenCalled();
  });

  it('flip', async () => {
    expect(manager.state.direction).toBe('front');

    await manager.flip();

    expect(manager.state.direction).toBe('back');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
