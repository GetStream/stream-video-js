import { useEffect } from 'react';
import Gleap from 'gleap';
import {
  Call,
  RxUtils,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import { getLayoutSettings } from './useLayoutSwitcher';

export const useGleap = (
  gleapApiKey: string | undefined,
  client: StreamVideoClient | undefined,
  user: User,
) => {
  useEffect(() => {
    if (gleapApiKey) {
      Gleap.initialize(gleapApiKey);
      Gleap.identify(user.name || user.id || '!anon', {
        name: user.name,
      });
    }
  }, [gleapApiKey, user.name, user.id]);

  useEffect(() => {
    if (!gleapApiKey || !client) return;

    Gleap.on('flow-started', () => {
      try {
        const state = client.readOnlyStateStore;
        const data = Object.entries(state).reduce<Record<string, any>>(
          (acc, [key, observable]) => {
            if (!!observable && typeof observable.subscribe === 'function') {
              const value = RxUtils.getCurrentValue<unknown>(observable);
              if (value && value instanceof Call) {
                // special handling for the active call
                acc[key] = serializeCallState(value);
              } else if (key === 'calls$' && Array.isArray(value)) {
                // special handling for the list of calls
                acc[key] = value.map(serializeCallState);
              } else {
                acc[key] = value;
              }
            }
            return acc;
          },
          {},
        );
        console.log('!!State Store', data);
        try {
          // Gleap stringifies the data internally.
          // Occasionally, this fails because the data contains circular references.
          // We don't want to crash the feedback submission flow.
          // We want to detect this early and include the serialization error
          // as part of the Gleap feedback item.
          JSON.stringify(data);
          Gleap.attachCustomData(data);
        } catch (e) {
          console.warn(e);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }, [client, gleapApiKey]);
};

export const serializeCallState = (call: Call) => {
  const { microphone, camera, speaker, screenShare } = call;
  const callState: Record<string, any> = {
    cid: call.cid,
    sfu: {
      edgeName: call['sfuClient']?.edgeName,
      sessionId: call['sfuClient']?.sessionId,
    },
    layout: getLayoutSettings()?.selectedLayout ?? 'N/A',
    devices: {
      microphone: {
        enabled: microphone.state.status,
        selectedDeviceId: microphone.state.selectedDevice,
        devices: RxUtils.getCurrentValue(microphone.listDevices()),
        defaultConstraints: microphone.state.defaultConstraints,
      },
      camera: {
        enabled: camera.state.status,
        selectedDeviceId: camera.state.selectedDevice,
        devices: RxUtils.getCurrentValue(camera.listDevices()),
        defaultConstraints: camera.state.defaultConstraints,
      },
      speakers: {
        selectedDeviceId: speaker.state.selectedDevice,
        devices: RxUtils.getCurrentValue(speaker.listDevices()),
      },
      screenShare: {
        enabled: screenShare.state.status,
        defaultConstraints: screenShare.state.defaultConstraints,
      },
    },
  };

  const ignoredKeys = [
    // we ignore `participants$` because, we would like to separately
    // report localParticipant$ and remoteParticipants$
    // (both of which are derived from participants$).
    'participants$',
  ];
  Object.entries(call.state)
    .filter(([k]) => k.endsWith('$') && !ignoredKeys.includes(k))
    .forEach(([k, v]) => {
      if (!!v && typeof v.subscribe === 'function') {
        callState[k] = RxUtils.getCurrentValue(v);
      } else {
        callState[k] = v;
      }
    });

  return callState;
};
