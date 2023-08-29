import { afterEach, beforeEach, describe, vi, it, expect } from 'vitest';
import { mockAudioDevices } from './mocks';
import { of } from 'rxjs';
import { SpeakerManager } from '../SpeakerManager';
import { checkIfAudioOutputChangeSupported } from '../devices';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices');
  return {
    getAudioOutputDevices: vi.fn(() => of(mockAudioDevices)),
    checkIfAudioOutputChangeSupported: vi.fn(() => true),
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
    expect(manager.state.selectedDevice).toBe(undefined);

    manager.select('new-device');

    expect(manager.state.selectedDevice).toBe('new-device');
  });

  it('set volume', async () => {
    expect(manager.state.volume).toBe(undefined);

    expect(() => manager.setVolume(2)).toThrowError();

    expect(manager.state.volume).toBe(undefined);

    manager.setVolume(0);

    expect(manager.state.volume).toBe(0);

    manager.setVolume(1);

    expect(manager.state.volume).toBe(1);

    manager.setVolume(0.5);

    expect(manager.state.volume).toBe(0.5);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
