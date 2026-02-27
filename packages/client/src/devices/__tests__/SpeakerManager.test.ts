/* @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  createLocalStorageMock,
  emitDeviceIds,
  LocalStorageMock,
  mockAudioDevices,
  mockBrowserPermission,
  mockDeviceIds$,
} from './mocks';
import { of } from 'rxjs';
import { SpeakerManager } from '../SpeakerManager';
import { checkIfAudioOutputChangeSupported } from '../devices';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { StreamVideoWriteableStateStore } from '../../store';
import { defaultDeviceId } from '../devicePersistence';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices');
  return {
    getAudioOutputDevices: vi.fn(() => of(mockAudioDevices)),
    checkIfAudioOutputChangeSupported: vi.fn(() => true),
    getAudioBrowserPermission: () => mockBrowserPermission,
    getVideoBrowserPermission: () => mockBrowserPermission,
    deviceIds$: mockDeviceIds$(),
    resolveDeviceId: (deviceId) => deviceId,
  };
});

describe('SpeakerManager.test', () => {
  let manager: SpeakerManager;
  let storageKey: string;
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    storageKey = '@test/speaker-preferences';
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });
    const devicePersistence = { enabled: false, storageKey };
    manager = new SpeakerManager(
      new Call({
        id: '',
        type: '',
        streamClient: new StreamClient('abc123'),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
      devicePersistence,
    );
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

  it('set participant volume', () => {
    const call = manager['call'];
    call.state.updateOrAddParticipant(
      'session-id',
      fromPartial({
        audioVolume: undefined,
        sessionId: 'session-id',
      }),
    );

    manager.setParticipantVolume('session-id', 0.5);
    let participant = call.state.findParticipantBySessionId('session-id');
    expect(participant!.audioVolume).toBe(0.5);

    manager.setParticipantVolume('session-id', undefined);
    participant = call.state.findParticipantBySessionId('session-id');
    expect(participant!.audioVolume).toBe(undefined);

    expect(() => manager.setParticipantVolume('session-id', 2)).toThrowError();
    expect(() => manager.setParticipantVolume('session-id', -1)).toThrowError();
  });

  it('should disable device if selected device is disconnected', () => {
    emitDeviceIds(mockAudioDevices);
    const deviceId = mockAudioDevices[1].deviceId;
    manager.select(deviceId);

    emitDeviceIds(mockAudioDevices.slice(2));

    expect(manager.state.selectedDevice).toBe('');
  });

  describe('apply (web)', () => {
    it('does nothing when persistence is disabled', () => {
      const selectSpy = vi.spyOn(manager, 'select');
      // @ts-expect-error - partial data
      manager.apply({});
      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('selects the persisted speaker device', () => {
      const persistedManager = new SpeakerManager(
        new Call({
          id: '',
          type: '',
          streamClient: new StreamClient('abc123'),
          clientStore: new StreamVideoWriteableStateStore(),
        }),
        { enabled: true, storageKey },
      );

      localStorageMock.setItem(
        storageKey,
        JSON.stringify({
          speaker: [
            {
              selectedDeviceId: 'speaker-1',
              selectedDeviceLabel: 'Speaker 1',
            },
          ],
        }),
      );

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      persistedManager.apply({});

      expect(selectSpy).toHaveBeenCalledWith('speaker-1');
      expect(persistedManager.state.selectedDevice).toBe('speaker-1');
    });

    it('selects system default when persisted device is default', () => {
      const persistedManager = new SpeakerManager(
        new Call({
          id: '',
          type: '',
          streamClient: new StreamClient('abc123'),
          clientStore: new StreamVideoWriteableStateStore(),
        }),
        { enabled: true, storageKey },
      );
      persistedManager.select('previous-device');

      localStorageMock.setItem(
        storageKey,
        JSON.stringify({
          speaker: [
            {
              selectedDeviceId: defaultDeviceId,
              selectedDeviceLabel: '',
            },
          ],
        }),
      );

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      persistedManager.apply({});

      expect(selectSpy).toHaveBeenCalledWith('');
      expect(persistedManager.state.selectedDevice).toBe('');
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: undefined,
    });
  });
});
