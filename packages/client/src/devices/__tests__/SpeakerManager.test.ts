import { afterEach, beforeEach, describe, vi, it, expect } from 'vitest';
import {
  disconnectDevice,
  mockAudioDevices,
  mockDeviceDisconnectWatcher,
} from './mocks';
import { of } from 'rxjs';
import { SpeakerManager } from '../SpeakerManager';
import { checkIfAudioOutputChangeSupported } from '../devices';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices');
  return {
    getAudioOutputDevices: vi.fn(() => of(mockAudioDevices)),
    checkIfAudioOutputChangeSupported: vi.fn(() => true),
    watchForDisconnectedDevice: mockDeviceDisconnectWatcher(),
  };
});

describe('SpeakerManager.test', () => {
  let manager: SpeakerManager;

  beforeEach(() => {
    manager = new SpeakerManager();
  });

  it('list devices', () => {
    const spy = vi.fn();
    manager.listDevices().subscribe(spy);

    expect(spy).toHaveBeenCalledWith(mockAudioDevices);
  });

  it('tell is browser supports audio output selection', async () => {
    expect(checkIfAudioOutputChangeSupported).toHaveBeenCalled();
    expect(manager.state.isDeviceSelectionSupported).toBe(true);
  });

  it('select', async () => {
    expect(manager.state.selectedDevice).toBe('');

    manager.select('new-device');

    expect(manager.state.selectedDevice).toBe('new-device');
  });

  it('set volume', async () => {
    expect(manager.state.volume).toBe(1);

    expect(() => manager.setVolume(2)).toThrowError();

    expect(manager.state.volume).toBe(1);

    manager.setVolume(0);

    expect(manager.state.volume).toBe(0);

    manager.setVolume(1);

    expect(manager.state.volume).toBe(1);

    manager.setVolume(0.5);

    expect(manager.state.volume).toBe(0.5);
  });

  it('should disable device if selected device is disconnected', () => {
    const deviceId = mockAudioDevices[1].deviceId;
    manager.select(deviceId);

    disconnectDevice();

    expect(manager.state.selectedDevice).toBe('');
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
