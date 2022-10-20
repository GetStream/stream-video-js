import { useEffect, useState } from 'react';
import { CallState } from '@stream-io/video-client/src/gen/video/sfu/models/models';
import { Stage } from './Stage';
import { Stats } from '../Stats';
import { useStreamVideoClient } from '../../StreamVideo';
import { Ping } from '../Ping';
import { useCall } from '../../hooks/useCall';
import { DeviceSettings } from './DeviceSettings';
import {
  MediaDevicesProvider,
  useMediaDevices,
} from '../../contexts/MediaDevicesContext';
import { CallControls } from './CallControls';
import { CreateCallInput } from '@stream-io/video-client';

export type CallProps = {
  currentUser: string;
  callId: string;
  callType: string;
  autoJoin?: boolean;
  includeSelf?: boolean;
  input?: CreateCallInput;
};

export const StreamCall = ({
  currentUser,
  callId,
  callType,
  autoJoin = true,
  includeSelf = false,
  input,
}: CallProps) => {
  const { activeCall, activeCallMeta } = useCall({
    callId,
    callType,
    currentUser,
    autoJoin,
    input,
  });

  const [sfuCallState, setSfuCallState] = useState<CallState>();
  useEffect(() => {
    const joinCall = async () => {
      // TODO: OL: announce bitrates by passing down MediaStream to .join()
      const callState = await activeCall?.join();
      setSfuCallState(callState);
    };

    if (activeCallMeta?.createdByUserId === currentUser || autoJoin) {
      // initiator, immediately joins the call
      joinCall().catch((e) => {
        console.error(`Error happened while joining a call`, e);
        setSfuCallState(undefined);
      });
    }

    return () => {
      activeCall?.leave();
    };
  }, [activeCall, autoJoin, activeCallMeta, currentUser]);

  const videoClient = useStreamVideoClient();
  return (
    <MediaDevicesProvider call={activeCall}>
      <div className="str-video__call">
        {sfuCallState && (
          <>
            {activeCallMeta && (
              <div className="str-video__call__header">
                <h4 className="str-video__call__header-title">
                  {activeCallMeta.type}:{activeCallMeta.id}
                </h4>
                <DeviceSettings />
              </div>
            )}
            {activeCall && (
              <>
                <Stage
                  participants={sfuCallState.participants}
                  call={activeCall}
                  includeSelf={includeSelf}
                />
                <CallControls call={activeCall} />
              </>
            )}
            {activeCallMeta && (
              <Ping activeCall={activeCallMeta} currentUser={currentUser} />
            )}
            {videoClient && activeCall && activeCallMeta && (
              <Stats
                client={videoClient}
                call={activeCall}
                activeCall={activeCallMeta}
              />
            )}
          </>
        )}
      </div>
    </MediaDevicesProvider>
  );
};
