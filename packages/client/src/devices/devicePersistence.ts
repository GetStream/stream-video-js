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
} & {
  // Backwards compatibility for older storage format.
  mic?: LocalDevicePreference | LocalDevicePreference[];
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
      hasLocalStorage && !isReactNative() ? (options?.enabled ?? false) : false,
  };
};

export const readPreferences = (storageKey: string): LocalDevicePreferences => {
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw) as LocalDevicePreferences;
    if (Object.hasOwn(parsed, 'mic') && !Object.hasOwn(parsed, 'microphone')) {
      parsed.microphone = parsed.mic;
    }
    return parsed;
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

  window.localStorage.setItem(
    storageKey,
    JSON.stringify({
      ...preferences,
      mic: undefined,
      [deviceKey]: [
        {
          selectedDeviceId,
          selectedDeviceLabel,
          ...(typeof muted === 'boolean' ? { muted } : {}),
        } satisfies LocalDevicePreference,
        ...preferenceHistory,
      ].slice(0, 3),
    } satisfies LocalDevicePreferences),
  );
};

export const toPreferenceList = (
  preference?: LocalDevicePreference | LocalDevicePreference[],
): LocalDevicePreference[] => (preference ? [preference].flat() : []);
