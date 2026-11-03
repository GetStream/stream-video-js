import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { of } from 'rxjs';
import { CameraManager } from '../CameraManager';
import { Call } from '../../Call';
import { CallingState } from '../../store';
import { PermissionsContext } from '../../permissions';
import {
  mockBrowserPermission,
  mockCall,
  mockVideoDevices,
  mockVideoStream,
} from './mocks';

const getVideoStream = vi.hoisted(() =>
  vi.fn(() => Promise.resolve(mockVideoStream())),
);

vi.mock('../../helpers/platforms', () => ({
  isReactNative: () => true,
}));

vi.mock('../devices.ts', () => ({
  disposeOfMediaStream: vi.fn(),
  getVideoDevices: vi.fn(() => of(mockVideoDevices)),
  getVideoStream,
  getAudioBrowserPermission: () => mockBrowserPermission,
  getVideoBrowserPermission: () => mockBrowserPermission,
  deviceIds$: {},
  resolveDeviceId: (deviceId: string) => deviceId,
}));

const settings = fromPartial({
  enabled: true,
  target_resolution: { width: 1280, height: 720 },
  camera_facing: 'front',
  camera_default_on: true,
});

describe('CameraManager React Native', () => {
  let call: Call;
  let manager: CameraManager;

  beforeEach(() => {
    getVideoStream.mockClear();
    call = mockCall() as Call;
    // @ts-expect-error - read only property
    call.permissionsContext = new PermissionsContext();
    call.permissionsContext.hasPermission = vi.fn().mockReturnValue(true);
    manager = new CameraManager(call, { enabled: false, storageKey: '' });
  });

  it('only records camera_default_on while joining, then acquires the camera once joined', async () => {
    // join() has created the media engine, but the lobby preview still owns the camera
    call.state.setCallingState(CallingState.JOINING);

    await manager.apply(settings, false);

    expect(getVideoStream).not.toHaveBeenCalled();
    expect(manager.state.optimisticStatus).toBe('enabled');
    expect(manager.state.status).toBe(undefined);

    call.state.setCallingState(CallingState.JOINED);
    await manager.apply(settings, true);

    expect(getVideoStream).toHaveBeenCalledOnce();
    expect(manager.state.status).toBe('enabled');
  });

  it('enables the camera right away when the call is already joined', async () => {
    await manager.apply(settings, false);

    expect(getVideoStream).toHaveBeenCalledOnce();
    expect(manager.state.status).toBe('enabled');
  });
});
