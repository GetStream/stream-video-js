import {
  CallControls,
  Stage,
  DeviceSettings,
} from '@stream-io/video-react-sdk';

import { useActiveCall } from '@stream-io/video-react-bindings';
import { useNavigate } from 'react-router-dom';
import { PropsWithChildren } from 'react';

export const MeetingUI = ({ children }: PropsWithChildren) => {
  const activeCall = useActiveCall();
  const navigate = useNavigate();

  if (!activeCall)
    return (
      <div className="w-full h-full flex justify-center items-center">
        Loading...
      </div>
    );

  const { type, id } = activeCall.data.call ?? {};

  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {type}:{id}
        </h4>
        <DeviceSettings />
      </div>
      <Stage call={activeCall} />
      <div className="relative flex justify-center items-center">
        <CallControls
          call={activeCall}
          onLeave={() => navigate('/call/lobby')}
        />
        {children}
      </div>
    </div>
  );
};
