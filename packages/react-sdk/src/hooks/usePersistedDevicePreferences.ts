import { useEffect, useState } from 'react';
import { CallingState, InputDeviceStatus } from '@stream-io/video-client';
import { useCallStateHooks } from '@stream-io/video-react-bindings';

export type LocalDevicePreference = {
  selectedDeviceId: string;
  selectedDeviceLabel: string;
  muted?: boolean;
};

export type LocalDevicePreferences = {
  // Array is preference history with latest preferences first.
  // Single preference still acceptable for backwards compatibility.
  [type in DeviceKey]?: LocalDevicePreference | LocalDevicePreference[];
};

type DeviceKey = 'microphone' | 'camera' | 'speaker';

type DeviceState<K extends DeviceKey> = {
  [ManagerKey in K]: DeviceManagerLike;
} & {
  isMute?: boolean;
  devices: MediaDeviceInfo[];
  selectedDevice: string | undefined;
};

interface DeviceManagerLike {
  state: { selectedDevice: string | undefined; status?: InputDeviceStatus };
  select: (deviceId: string) => Promise<void> | void;
  enable?: () => Promise<void>;
  disable?: () => Promise<void>;
}

const defaultDevice = 'default';

/**
 * This hook will apply and persist the device preferences from local storage.
 *
 * @param key the key to use for local storage.
 */
export const usePersistedDevicePreferences = (
  key: string = '@stream-io/device-preferences',
): void => {
  const {
    useCallSettings,
    useCallCallingState,
    useMicrophoneState,
    useCameraState,
    useSpeakerState,
  } = useCallStateHooks();
  const settings = useCallSettings();
  const callingState = useCallCallingState();

  const microphoneState: DeviceState<'microphone'> = useMicrophoneState();
  const cameraState: DeviceState<'camera'> = useCameraState();
  const speakerState: DeviceState<'speaker'> = useSpeakerState();

  const [applyingState, setApplyingState] = useState<
    'idle' | 'applying' | 'applied'
  >('idle');

  // when the camera is disabled on call type level, we should discard
  // any stored camera preferences.
  const cameraDevices = settings?.video?.enabled ? cameraState.devices : false;
  useEffect(
    function apply() {
      if (
        callingState === CallingState.LEFT ||
        microphoneState.devices.length === 0 ||
        (Array.isArray(cameraDevices) && cameraDevices.length === 0) ||
        speakerState.devices.length === 0 ||
        !settings ||
        applyingState !== 'idle'
      ) {
        return;
      }

      setApplyingState('applying');

      (async () => {
        const { audio, video } = settings;
        for (const [deviceKey, state, defaultMuted, enabledInCallType] of [
          ['microphone', microphoneState, !audio.mic_default_on, true],
          ['camera', cameraState, !video.camera_default_on, video.enabled],
          ['speaker', speakerState, false, true],
        ] as const) {
          const preferences = parseLocalDevicePreferences(key);
          const preference = preferences[deviceKey];
          const manager = (
            state as DeviceState<'camera' | 'microphone' | 'speaker'>
          )[deviceKey];

          const applyPromise = preference
            ? applyLocalDevicePreference(
                manager,
                [preference].flat(),
                deviceKey === 'camera' ? cameraDevices || [] : state.devices,
                enabledInCallType,
              )
            : applyMutedState(manager, defaultMuted, enabledInCallType);

          await applyPromise.catch((err) => {
            console.warn(
              `Failed to apply ${deviceKey} device preferences`,
              err,
            );
          });
        }
      })().finally(() =>
        setApplyingState((state) => (state === 'applying' ? 'applied' : state)),
      );
    },
    [
      applyingState,
      callingState,
      cameraState,
      cameraDevices,
      key,
      microphoneState,
      microphoneState.devices,
      settings,
      speakerState,
      speakerState.devices,
    ],
  );

  useEffect(
    function persist() {
      if (callingState === CallingState.LEFT || applyingState !== 'applied') {
        return;
      }

      for (const [deviceKey, devices, selectedDevice, isMute] of [
        [
          'camera',
          cameraDevices || [],
          cameraState.selectedDevice,
          cameraState.isMute,
        ],
        [
          'microphone',
          microphoneState.devices,
          microphoneState.selectedDevice,
          microphoneState.isMute,
        ],
        [
          'speaker',
          speakerState.devices,
          speakerState.selectedDevice,
          speakerState.isMute,
        ],
      ] as const) {
        try {
          patchLocalDevicePreference(key, deviceKey, {
            devices,
            selectedDevice,
            isMute,
          });
        } catch (err) {
          console.warn(`Failed to save ${deviceKey} device preferences`, err);
        }
      }
    },
    [
      applyingState,
      callingState,
      cameraDevices,
      cameraState.isMute,
      cameraState.selectedDevice,
      key,
      microphoneState.devices,
      microphoneState.isMute,
      microphoneState.selectedDevice,
      speakerState.devices,
      speakerState.isMute,
      speakerState.selectedDevice,
    ],
  );
};

// const usePersistedDevicePreference = <K extends DeviceKey>(
//   key: string,
//   deviceKey: K,
//   state: DeviceState<K>,
//   defaultMuted?: boolean,
// ): void => {
//   const { useCallCallingState } = useCallStateHooks();
//   const callingState = useCallCallingState();
//   const [applyingState, setApplyingState] = useState<
//     'idle' | 'applying' | 'applied'
//   >('idle');
//   const manager = state[deviceKey];

//   useEffect(
//     function apply() {
//       if (
//         callingState === CallingState.LEFT ||
//         !state.devices?.length ||
//         typeof defaultMuted !== 'boolean' ||
//         applyingState !== 'idle'
//       ) {
//         return;
//       }

//       const preferences = parseLocalDevicePreferences(key);
//       const preference = preferences[deviceKey];

//       setApplyingState('applying');

//       if (!manager.state.selectedDevice) {
//         const applyPromise = preference
//           ? applyLocalDevicePreference(
//               manager,
//               [preference].flat(),
//               state.devices,
//             )
//           : applyMutedState(manager, defaultMuted);

//         applyPromise
//           .catch((err) => {
//             console.warn(
//               `Failed to apply ${deviceKey} device preferences`,
//               err,
//             );
//           })
//           .finally(() => setApplyingState('applied'));
//       } else {
//         setApplyingState('applied');
//       }
//     },
//     [
//       applyingState,
//       callingState,
//       defaultMuted,
//       deviceKey,
//       key,
//       manager,
//       state.devices,
//     ],
//   );

//   useEffect(
//     function persist() {
//       if (
//         callingState === CallingState.LEFT ||
//         !state.devices?.length ||
//         applyingState !== 'applied'
//       ) {
//         return;
//       }

//       try {
//         patchLocalDevicePreference(key, deviceKey, {
//           devices: state.devices,
//           selectedDevice: state.selectedDevice,
//           isMute: state.isMute,
//         });
//       } catch (err) {
//         console.warn(`Failed to save ${deviceKey} device preferences`, err);
//       }
//     },
//     [
//       applyingState,
//       callingState,
//       deviceKey,
//       key,
//       state.devices,
//       state.isMute,
//       state.selectedDevice,
//     ],
//   );
// };

const parseLocalDevicePreferences = (key: string): LocalDevicePreferences => {
  const preferencesStr = window.localStorage.getItem(key);
  let preferences: LocalDevicePreferences = {};

  if (preferencesStr) {
    try {
      preferences = JSON.parse(preferencesStr);

      if (Object.hasOwn(preferences, 'mic')) {
        // for backwards compatibility
        preferences.microphone = (
          preferences as { mic: LocalDevicePreference }
        ).mic;
      }
    } catch {
      /* assume preferences are empty */
    }
  }

  return preferences;
};

const patchLocalDevicePreference = (
  key: string,
  deviceKey: DeviceKey,
  state: Pick<DeviceState<never>, 'devices' | 'selectedDevice' | 'isMute'>,
): void => {
  const preferences = parseLocalDevicePreferences(key);
  const nextPreference = getSelectedDevicePreference(
    state.devices,
    state.selectedDevice,
  );
  const preferenceHistory = [preferences[deviceKey] ?? []]
    .flat()
    .filter(
      (p) =>
        p.selectedDeviceId !== nextPreference.selectedDeviceId &&
        (p.selectedDeviceLabel === '' ||
          p.selectedDeviceLabel !== nextPreference.selectedDeviceLabel),
    );

  window.localStorage.setItem(
    key,
    JSON.stringify({
      ...preferences,
      mic: undefined, // for backwards compatibility
      [deviceKey]: [
        {
          ...nextPreference,
          muted: state.isMute,
        } satisfies LocalDevicePreference,
        ...preferenceHistory,
      ].slice(0, 3),
    }),
  );
};

const applyLocalDevicePreference = async (
  manager: DeviceManagerLike,
  preference: LocalDevicePreference[],
  devices: MediaDeviceInfo[],
  enabledInCallType: boolean,
): Promise<void> => {
  let muted: boolean | undefined;

  for (const p of preference) {
    muted ??= p.muted;

    if (p.selectedDeviceId === defaultDevice) {
      break;
    }

    const device =
      devices.find((d) => d.deviceId === p.selectedDeviceId) ??
      devices.find((d) => d.label === p.selectedDeviceLabel);

    if (device) {
      if (!manager.state.selectedDevice) {
        await manager.select(device.deviceId);
      }

      muted = p.muted;
      break;
    }
  }

  if (typeof muted === 'boolean') {
    await applyMutedState(manager, muted, enabledInCallType);
  }
};

const applyMutedState = async (
  manager: DeviceManagerLike,
  muted: boolean,
  enabledInCallType: boolean,
) => {
  if (enabledInCallType && !manager.state.status) {
    await manager[muted ? 'disable' : 'enable']?.();
  }
};

const getSelectedDevicePreference = (
  devices: MediaDeviceInfo[],
  selectedDevice: string | undefined,
): Pick<LocalDevicePreference, 'selectedDeviceId' | 'selectedDeviceLabel'> => ({
  selectedDeviceId: selectedDevice || defaultDevice,
  selectedDeviceLabel:
    devices?.find((d) => d.deviceId === selectedDevice)?.label ?? '',
});
