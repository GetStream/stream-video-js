import { isReactNative } from '../helpers/platforms';

export type DevicePersistenceOptions = {
  /**
   * Enables device preference persistence on web.
   * @default true
   */
  enabled?: boolean;
  /**
   * Storage key for persisted preferences.
   * @default '@stream-io/device-preferences'
   */
  storageKey?: string;
};

export type DevicePreferenceKey = 'microphone' | 'camera' | 'speaker';

export type LocalDevicePreference = {
  selectedDeviceId: string;
  selectedDeviceLabel: string;
  muted?: boolean;
};

export type LocalDevicePreferences = {
  [type in DevicePreferenceKey]?:
    | LocalDevicePreference
    | LocalDevicePreference[];
};

export const defaultDeviceId = 'default';

export const normalize = (
  options: DevicePersistenceOptions | undefined,
): Required<DevicePersistenceOptions> => {
  const hasLocalStorage =
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  return {
    storageKey: options?.storageKey ?? `@stream-io/device-preferences`,
    enabled:
      hasLocalStorage && !isReactNative() ? (options?.enabled ?? true) : false,
  };
};

export const createSyntheticDevice = (
  deviceId: string,
  kind: MediaDeviceKind,
): MediaDeviceInfo => {
  return { deviceId, kind, label: '', groupId: '' } as MediaDeviceInfo;
};

export const readPreferences = (storageKey: string): LocalDevicePreferences => {
  try {
    const raw = window.localStorage.getItem(storageKey) || '{}';
    return JSON.parse(raw) as LocalDevicePreferences;
  } catch {
    return {};
  }
};

export const writePreferences = (
  currentDevice: MediaDeviceInfo | undefined,
  deviceKey: DevicePreferenceKey,
  muted: boolean | undefined,
  storageKey: string,
) => {
  const selectedDeviceId = currentDevice?.deviceId ?? defaultDeviceId;
  const selectedDeviceLabel = currentDevice?.label ?? '';

  const preferences = readPreferences(storageKey);
  const preferenceHistory = [preferences[deviceKey] ?? []]
    .flat()
    .filter(
      (p) =>
        p.selectedDeviceId !== selectedDeviceId &&
        (p.selectedDeviceLabel === '' ||
          p.selectedDeviceLabel !== selectedDeviceLabel),
    );

  const nextPreferences: LocalDevicePreferences = {
    ...preferences,
    [deviceKey]: [
      {
        selectedDeviceId,
        selectedDeviceLabel,
        ...(typeof muted === 'boolean' ? { muted } : {}),
      } satisfies LocalDevicePreference,
      ...preferenceHistory,
    ].slice(0, 3),
  };
  window.localStorage.setItem(storageKey, JSON.stringify(nextPreferences));
};

export const toPreferenceList = (
  preference?: LocalDevicePreference | LocalDevicePreference[],
): LocalDevicePreference[] => (preference ? [preference].flat() : []);
