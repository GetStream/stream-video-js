import { useEffect, useState } from 'react';
import { Stage } from './Stage';
import { useCall } from '../../hooks/useCall';
import { DeviceSettings } from './DeviceSettings';
import { MediaDevicesProvider } from '../../contexts/MediaDevicesContext';
import { CallControls } from './CallControls';
import { CreateCallInput } from '@stream-io/video-client';

export type CallProps = {
  currentUser: string;
  callId: string;
  callType: string;
  autoJoin?: boolean;
  input?: CreateCallInput;
};

export const StreamCall = ({
  currentUser,
  callId,
  callType,
  autoJoin = true,
  input,
}: CallProps) => {
  const { activeCall, activeCallMeta } = useCall({
    callId,
    callType,
    autoJoin,
    input,
  });

  const [isInCall, setIsInCall] = useState<boolean>(false);
  useEffect(() => {
    const joinCall = async () => {
      await activeCall?.join();
      setIsInCall(true);
    };

    if (activeCallMeta?.createdByUserId === currentUser || autoJoin) {
      // initiator, immediately joins the call
      joinCall().catch((e) => {
        console.error(`Error happened while joining a call`, e);
        setIsInCall(false);
      });
    }

    return () => {
      activeCall?.leave();
      setIsInCall(false);
    };
  }, [activeCall, autoJoin, activeCallMeta, currentUser]);

  return (
    <MediaDevicesProvider>
      <div className="str-video__call">
        {isInCall && (
          <>
            {activeCallMeta && activeCall && (
              <div className="str-video__call__header">
                <h4 className="str-video__call__header-title">
                  {activeCallMeta.type}:{activeCallMeta.id}
                </h4>
                <DeviceSettings activeCall={activeCall} />
              </div>
            )}
            {activeCall && (
              <>
                <Stage call={activeCall} />
                <CallControls call={activeCall} callMeta={activeCallMeta} />
              </>
            )}
          </>
        )}
      </div>
    </MediaDevicesProvider>
  );
};
