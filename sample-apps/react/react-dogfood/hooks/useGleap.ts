import { useEffect, useRef, useState } from 'react';
import Gleap from 'gleap';
import {
  Call,
  RxUtils,
  StreamVideoClient,
  User,
} from '@stream-io/video-react-sdk';
import { getLayoutSettings } from './useLayoutSwitcher';

type GleapReportPayload = {
  type: 'gleap.report';
  userId: string | undefined;
  toUserId: string;
  totalChunks: number;
  chunkIndex: number;
  data: string;
};

const MAX_LOGS_QUEUE_SIZE = 350;

export const useGleap = (
  gleapApiKey: string | null | undefined,
  client: StreamVideoClient | undefined,
  call: Call | undefined,
  user: User,
) => {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    if (gleapApiKey && !isInitialized) {
      Gleap.initialize(gleapApiKey);
      Gleap.identify(user.name || user.id || '!anon', {
        name: user.name,
      });
      setIsInitialized(true);
    }
  }, [gleapApiKey, user.name, user.id, isInitialized]);

  const logsQueue = useRef<string[]>([]);
  const pushToLogQueue = (log: string) => {
    if (logsQueue.current.length >= MAX_LOGS_QUEUE_SIZE) {
      logsQueue.current.shift();
    }
    logsQueue.current.push(log);
  };

  useEffect(() => {
    if (!gleapApiKey || !call) return;

    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const stringify = (o: any) => {
      if (typeof o !== 'object') return o;
      try {
        return JSON.stringify(o);
      } catch (e) {
        return o;
      }
    };
    const timestamp = () => {
      const d = new Date();
      return `${d.getHours()}:${d.getMinutes()}:${d.getSeconds()}.${d.getMilliseconds()}`;
    };
    console.log = (...args: any[]) => {
      originalLog(...args);
      pushToLogQueue(`[LOG: ${timestamp()}] ${args.map(stringify).join(' ')}`);
    };
    console.warn = (...args: any[]) => {
      originalWarn(...args);
      pushToLogQueue(`[WARN: ${timestamp()}] ${args.map(stringify).join(' ')}`);
    };
    console.error = (...args: any[]) => {
      originalError(...args);
      pushToLogQueue(`[ERR: ${timestamp()}] ${args.map(stringify).join(' ')}`);
    };

    const off = call.on('custom', async (event) => {
      if (event.type !== 'custom') return;
      const { type } = event.custom;
      if (
        type === 'gleap.collect-report' &&
        event.user.id !== call.currentUserId
      ) {
        const report = serializeCallState(call);
        report.logs = logsQueue.current;
        const serializedReport = JSON.stringify(report);
        // split in 4.6k chunks - custom events have a 5k limit
        const chunkSize = 4600;
        const chunks = serializedReport.match(
          new RegExp(`.{1,${chunkSize}}`, 'g'),
        );
        // send each chunk as a separate event
        if (!chunks) return;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          await call.sendCustomEvent({
            type: 'gleap.report',
            userId: call.currentUserId,
            toUserId: event.user.id,
            totalChunks: chunks.length,
            chunkIndex: i,
            data: chunk,
          } satisfies GleapReportPayload);
        }
      }
    });
    return () => {
      off();
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, [call, gleapApiKey]);

  useEffect(() => {
    if (!gleapApiKey || !call) return;
    const cache = new Map<string, string[]>();
    return call.on('custom', (event) => {
      if (event.type !== 'custom') return;
      const { custom } = event;
      const { type, userId, toUserId, totalChunks, chunkIndex, data } =
        custom as GleapReportPayload;
      if (
        type === 'gleap.report' &&
        userId &&
        toUserId === call.currentUserId
      ) {
        if (!cache.has(userId)) {
          cache.set(userId, Array.from({ length: totalChunks }));
        }
        const existingData = cache.get(userId)!;
        existingData[chunkIndex] = data;
        // wait until we have all chunks
        if (existingData.every((d) => !!d)) {
          const report = JSON.parse(existingData.join(''));
          Gleap.attachCustomData({
            [userId]: report,
          });
        }
      }
    });
  }, [call, gleapApiKey]);

  useEffect(() => {
    if (!gleapApiKey || !client || !call) return;

    Gleap.on('open', async () => {
      await call.sendCustomEvent({ type: 'gleap.collect-report' });
    });

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
          Gleap.attachCustomData({
            [call.currentUserId || 'me']: data,
          });
        } catch (e) {
          console.warn(e);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }, [call, client, gleapApiKey]);
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
