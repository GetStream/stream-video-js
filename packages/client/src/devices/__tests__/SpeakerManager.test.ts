/* @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import {
  createLocalStorageMock,
  emitDeviceIds,
  LocalStorageMock,
  mockAudioDevices,
  mockAudioOutputDevices,
  mockBrowserPermission,
  mockDeviceIds$,
  mockDevicesWithoutAudioPermission,
} from './mocks';
import { of } from 'rxjs';
import { SpeakerManager } from '../SpeakerManager';
import { checkIfAudioOutputChangeSupported } from '../devices';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { ClientEventReporter } from '../../reporting';
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
    vi.spyOn(mockBrowserPermission, 'asStateObservable').mockReturnValue(
      of('granted'),
    );
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });
    const devicePersistence = { enabled: false, storageKey };
    const streamClient = new StreamClient('abc123');
    manager = new SpeakerManager(
      new Call({
        id: '',
        type: '',
        streamClient,
        clientEventReporter: new ClientEventReporter({ streamClient }),
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
    const deviceId = mockAudioOutputDevices[0].deviceId;
    emitDeviceIds([...mockAudioDevices, ...mockAudioOutputDevices]);
    manager.select(deviceId);

    emitDeviceIds([...mockAudioDevices, ...mockAudioOutputDevices.slice(1)]);

    expect(manager.state.selectedDevice).toBe('');
  });

  it('should keep the selection when the device list never exposed audio ids', () => {
    const deviceId = mockAudioOutputDevices[0].deviceId;
    emitDeviceIds(mockDevicesWithoutAudioPermission);

    manager.select(deviceId);
    expect(manager.state.selectedDevice).toBe(deviceId);

    emitDeviceIds(mockDevicesWithoutAudioPermission);
    expect(manager.state.selectedDevice).toBe(deviceId);
  });

  it('should keep the selection when the device appears in a later enumeration', () => {
    const deviceId = mockAudioOutputDevices[0].deviceId;
    emitDeviceIds(mockDevicesWithoutAudioPermission);
    manager.select(deviceId);

    emitDeviceIds([...mockAudioDevices, ...mockAudioOutputDevices]);

    expect(manager.state.selectedDevice).toBe(deviceId);
  });

  it('persists speaker selection when permission is granted', async () => {
    const streamClient = new StreamClient('abc123');
    const persistedManager = new SpeakerManager(
      new Call({
        id: '',
        type: '',
        streamClient,
        clientEventReporter: new ClientEventReporter({ streamClient }),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
      { enabled: true, storageKey },
    );
    const listDevicesSpy = vi.spyOn(persistedManager, 'listDevices');
    const audioOutputDevice = {
      deviceId: 'speaker-1',
      kind: 'audiooutput',
      label: 'Speaker 1',
      groupId: 'speaker-group',
    } as MediaDeviceInfo;

    emitDeviceIds([audioOutputDevice]);
    persistedManager.select(audioOutputDevice.deviceId);

    expect(listDevicesSpy).toHaveBeenCalled();
    expect(persistedManager.state.selectedDevice).toBe('speaker-1');
  });

  describe('apply (web)', () => {
    const createPersistedManager = () => {
      const streamClient = new StreamClient('abc123');
      return new SpeakerManager(
        new Call({
          id: '',
          type: '',
          streamClient,
          clientEventReporter: new ClientEventReporter({ streamClient }),
          clientStore: new StreamVideoWriteableStateStore(),
        }),
        { enabled: true, storageKey },
      );
    };

    const persist = (selectedDeviceId: string, selectedDeviceLabel: string) => {
      localStorageMock.setItem(
        storageKey,
        JSON.stringify({
          speaker: [{ selectedDeviceId, selectedDeviceLabel }],
        }),
      );
    };

    it('does nothing when persistence is disabled', async () => {
      const selectSpy = vi.spyOn(manager, 'select');
      // @ts-expect-error - partial data
      await manager.apply({});
      expect(selectSpy).not.toHaveBeenCalled();
    });

    it('selects the persisted speaker device', async () => {
      const persistedManager = createPersistedManager();
      vi.spyOn(persistedManager, 'listDevices').mockReturnValue(
        of([
          {
            deviceId: 'speaker-1',
            kind: 'audiooutput',
            label: 'Speaker 1',
            groupId: 'speaker-group',
          } as MediaDeviceInfo,
        ]),
      );
      persist('speaker-1', 'Speaker 1');

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      await persistedManager.apply({});

      expect(selectSpy).toHaveBeenCalledWith('speaker-1');
      expect(persistedManager.state.selectedDevice).toBe('speaker-1');
    });

    it('does not select a missing persisted speaker device', async () => {
      const persistedManager = createPersistedManager();
      vi.spyOn(persistedManager, 'listDevices').mockReturnValue(
        of(mockAudioOutputDevices),
      );
      persist('speaker-1', 'Speaker 1');

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      await persistedManager.apply({});

      expect(selectSpy).not.toHaveBeenCalled();
      expect(persistedManager.state.selectedDevice).toBe('');
    });

    it('does not restore a speaker preference when audio permission is not granted', async () => {
      const persistedManager = createPersistedManager();
      vi.spyOn(mockBrowserPermission, 'asStateObservable').mockReturnValue(
        of('prompt'),
      );
      const listDevicesSpy = vi.spyOn(persistedManager, 'listDevices');
      persist('speaker-1', 'Speaker 1');

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      await persistedManager.apply({});

      expect(listDevicesSpy).not.toHaveBeenCalled();
      expect(selectSpy).not.toHaveBeenCalled();
      expect(persistedManager.state.selectedDevice).toBe('');
    });

    it('does not restore a speaker preference from a non-output device with the same label', async () => {
      const persistedManager = createPersistedManager();
      const videoDevice = {
        deviceId: 'video-device-id',
        kind: 'videoinput',
        label: 'RODECaster Video (19f7:006b)',
        groupId: 'video-group',
      } as MediaDeviceInfo;
      const outputDevice = {
        deviceId: 'speaker-device-id',
        kind: 'audiooutput',
        label: 'RODECaster Video (19f7:006b)',
        groupId: 'speaker-group',
      } as MediaDeviceInfo;
      vi.spyOn(persistedManager, 'listDevices').mockReturnValue(
        of([outputDevice]),
      );
      persist('missing-speaker-device-id', outputDevice.label);

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      await persistedManager.apply({});

      expect(selectSpy).toHaveBeenCalledWith(outputDevice.deviceId);
      expect(selectSpy).not.toHaveBeenCalledWith(videoDevice.deviceId);
      expect(persistedManager.state.selectedDevice).toBe(outputDevice.deviceId);
    });

    it('does not restore a speaker preference from an empty label placeholder', async () => {
      const persistedManager = createPersistedManager();
      vi.spyOn(persistedManager, 'listDevices').mockReturnValue(
        of([
          {
            deviceId: '',
            kind: 'audiooutput',
            label: '',
            groupId: '',
          } as MediaDeviceInfo,
        ]),
      );
      persist('missing-speaker-device-id', '');

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      await persistedManager.apply({});

      expect(selectSpy).not.toHaveBeenCalled();
      expect(persistedManager.state.selectedDevice).toBe('');
    });

    it('selects system default when persisted device is default', async () => {
      const persistedManager = createPersistedManager();
      persistedManager.select('previous-device');
      persist(defaultDeviceId, '');

      const selectSpy = vi.spyOn(persistedManager, 'select');
      // @ts-expect-error - partial data
      await persistedManager.apply({});

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
