import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';

import { afterEach, beforeEach, describe, vi, it, expect, Mock } from 'vitest';
import { mockCall, mockVideoDevices, mockVideoStream } from './mocks';
import { getVideoStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';
import { CameraManager } from '../CameraManager';
import { of } from 'rxjs';
import { CallSettingsResponse } from '../../gen/coordinator';

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

  it('get stream', async () => {
    await manager.enable();

    expect(getVideoStream).toHaveBeenCalledWith({
      deviceId: undefined,
      facingMode: 'user',
    });
  });

  it('should get device id from stream', async () => {
    expect(manager.state.selectedDevice).toBeUndefined();

    await manager.enable();

    expect(manager.state.selectedDevice).toBeDefined();
  });

  it('publish stream', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;

    await manager.enable();

    expect(manager['call'].publishVideoStream).toHaveBeenCalledWith(
      manager.state.mediaStream,
    );
  });

  it('stop publish stream', async () => {
    // @ts-expect-error
    manager['call'].state.callingState = CallingState.JOINED;
    await manager.enable();

    await manager.disable();

    expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.VIDEO);
  });

  it('flip', async () => {
    expect(manager.state.direction).toBe('front');

    await manager.flip();

    expect(manager.state.direction).toBe('back');
  });

  it(`shouldn't set deviceId and facingMode at the same time`, async () => {
    await manager.enable();

    await manager.flip();

    expect(getVideoStream).toHaveBeenCalledWith({ facingMode: 'environment' });

    const deviceId = mockVideoDevices[1].deviceId;
    await manager.select(deviceId);

    expect((getVideoStream as Mock).mock.lastCall[0]).toEqual({
      deviceId,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
