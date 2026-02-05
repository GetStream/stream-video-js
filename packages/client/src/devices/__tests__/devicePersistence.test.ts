/* @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  defaultDeviceId,
  normalize,
  readPreferences,
  writePreferences,
} from '../devicePersistence';
import { createLocalStorageMock, LocalStorageMock } from './mocks';

const storageKey = '@test/device-preferences';

const createDevice = (
  deviceId: string,
  label: string,
  kind: MediaDeviceKind = 'audioinput',
): MediaDeviceInfo =>
  ({
    deviceId,
    label,
    kind,
    groupId: 'group-1',
  }) as MediaDeviceInfo;

describe('devicePersistence', () => {
  let localStorageMock: LocalStorageMock;

  beforeEach(() => {
    localStorageMock = createLocalStorageMock();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });
    localStorageMock.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: undefined,
    });
  });

  it('enables persistence by default when localStorage is available', () => {
    expect(normalize(undefined).enabled).toBe(true);
  });

  it('disables persistence when explicitly turned off', () => {
    expect(normalize({ enabled: false }).enabled).toBe(false);
  });

  it('persists device data correctly', () => {
    const device = createDevice('mic-1', 'Mic 1');

    writePreferences(device, 'microphone', true, storageKey);

    const preferences = readPreferences(storageKey);
    expect(preferences.microphone).toEqual([
      {
        selectedDeviceId: 'mic-1',
        selectedDeviceLabel: 'Mic 1',
        muted: true,
      },
    ]);
  });

  it('persists only the three most recent entries per device type', () => {
    writePreferences(
      createDevice('mic-1', 'Mic 1'),
      'microphone',
      false,
      storageKey,
    );
    writePreferences(
      createDevice('mic-2', 'Mic 2'),
      'microphone',
      false,
      storageKey,
    );
    writePreferences(
      createDevice('mic-3', 'Mic 3'),
      'microphone',
      false,
      storageKey,
    );
    writePreferences(
      createDevice('mic-4', 'Mic 4'),
      'microphone',
      false,
      storageKey,
    );

    const preferences = readPreferences(storageKey);
    expect(preferences.microphone).toEqual([
      {
        selectedDeviceId: 'mic-4',
        selectedDeviceLabel: 'Mic 4',
        muted: false,
      },
      {
        selectedDeviceId: 'mic-3',
        selectedDeviceLabel: 'Mic 3',
        muted: false,
      },
      {
        selectedDeviceId: 'mic-2',
        selectedDeviceLabel: 'Mic 2',
        muted: false,
      },
    ]);
  });

  it('loads preferences from storage', () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        camera: {
          selectedDeviceId: 'cam-1',
          selectedDeviceLabel: 'Cam 1',
        },
      }),
    );

    const preferences = readPreferences(storageKey);
    expect(preferences.camera).toEqual({
      selectedDeviceId: 'cam-1',
      selectedDeviceLabel: 'Cam 1',
    });
  });

  it('uses default device when none is provided', () => {
    writePreferences(undefined, 'speaker', undefined, storageKey);

    const preferences = readPreferences(storageKey);
    expect(preferences.speaker).toEqual([
      {
        selectedDeviceId: defaultDeviceId,
        selectedDeviceLabel: '',
      },
    ]);
  });
});
