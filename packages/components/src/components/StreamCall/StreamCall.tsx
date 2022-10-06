import { ICEServer } from '@stream-io/video-client';
import { Call, Client, User } from '@stream-io/video-client-sfu';
import { useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { CallState } from '@stream-io/video-client-sfu/src/gen/sfu_models/models';
import { Stage } from './Stage';
import { Stats } from '../Stats';
import { useStreamVideoClient } from '../../StreamVideo';
import { Ping } from '../Ping';
import { useCall } from '../../hooks/useCall';
import { DeviceSettings } from './DeviceSettings';
import { MediaDevicesProvider } from '../../contexts/MediaDevicesContext';
import { CallControls } from './CallControls';

export type RoomProps = {
  currentUser: string;
  callId: string;
  callType: string;
  autoJoin?: boolean;
  includeSelf?: boolean;
};

export const StreamCall = ({
  currentUser,
  callId,
  callType,
  autoJoin = true,
  includeSelf = false,
}: RoomProps) => {
  const { activeCall, credentials } = useCall({
    callId,
    callType,
    currentUser,
    autoJoin,
  });

  const sessionId = useSessionId(callId, currentUser);
  const call = useMemo(() => {
    if (!credentials) return;
    const user = new User(currentUser, credentials.token);
    const serverUrl = credentials.server?.url || 'http://localhost:3031/twirp';
    const client = new Client(serverUrl, user, sessionId);
    return new Call(client, {
      connectionConfig:
        toRtcConfiguration(credentials.iceServers) ||
        defaultRtcConfiguration(serverUrl),
    });
  }, [credentials, currentUser, sessionId]);

  const [sfuCallState, setSfuCallState] = useState<CallState>();
  useEffect(() => {
    const joinCall = async () => {
      // TODO: OL: announce bitrates by passing down MediaStream to .join()
      const callState = await call?.join();
      setSfuCallState(callState);
    };

    if (activeCall?.createdByUserId === currentUser || autoJoin) {
      // initiator, immediately joins the call
      joinCall().catch((e) => {
        console.error(`Error happened while joining a call`, e);
        setSfuCallState(undefined);
      });
    }

    return () => {
      call?.leave();
    };
  }, [activeCall?.createdByUserId, autoJoin, call, currentUser]);

  const videoClient = useStreamVideoClient();
  return (
    <MediaDevicesProvider call={call}>
      <div className="str-video__call">
        {sfuCallState && (
          <>
            {activeCall && (
              <div className="str-video__call__header">
                <h4 className="str-video__call__header-title">
                  {activeCall.type}:{activeCall.id}
                </h4>
                <DeviceSettings />
              </div>
            )}
            {call && (
              <>
                <Stage
                  participants={sfuCallState.participants}
                  call={call}
                  includeSelf={includeSelf}
                  currentUserId={currentUser}
                />
                <CallControls call={call} />
              </>
            )}
            {activeCall && (
              <Ping activeCall={activeCall} currentUser={currentUser} />
            )}
            {videoClient && activeCall && call && (
              <Stats client={videoClient} call={call} activeCall={activeCall} />
            )}
          </>
        )}
      </div>
    </MediaDevicesProvider>
  );
};

const toRtcConfiguration = (config?: ICEServer[]) => {
  if (!config || config.length === 0) return undefined;
  const rtcConfig: RTCConfiguration = {
    iceServers: config.map((ice) => ({
      urls: ice.urls,
      username: ice.username,
      credential: ice.password,
    })),
  };
  return rtcConfig;
};

const defaultRtcConfiguration = (sfuUrl: string): RTCConfiguration => ({
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
    {
      urls: `turn:${hostnameFromUrl(sfuUrl)}:3478`,
      username: 'video',
      credential: 'video',
    },
  ],
});

const hostnameFromUrl = (url: string) => {
  try {
    return new URL(url).hostname;
  } catch (e) {
    console.warn(`Invalid URL. Can't extract hostname from it.`, e);
    return url;
  }
};

const useSessionId = (callId: string, currentUser: string) => {
  return useMemo(() => {
    const callKey = callId + '|' + currentUser;
    let sessions: { [callKey: string]: string };
    try {
      sessions = JSON.parse(
        localStorage.getItem('@stream.io/sessions') || '{}',
      );
    } catch (e) {
      sessions = {};
    }

    if (!sessions[callKey]) {
      sessions[callKey] = uuidv4();
      localStorage.setItem('@stream.io/sessions', JSON.stringify(sessions));
    }

    return sessions[callKey];
  }, [callId, currentUser]);
};
