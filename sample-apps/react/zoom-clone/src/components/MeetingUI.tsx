import {
  CallControls,
  DeviceSettings,
  SpeakerLayout,
  useCall,
} from '@stream-io/video-react-sdk';
import { useNavigate } from 'react-router-dom';
import { PropsWithChildren } from 'react';

export const MeetingUI = ({ children }: PropsWithChildren) => {
  const activeCall = useCall();
  const navigate = useNavigate();

  if (!activeCall)
    return (
      <div className="w-full h-full flex justify-center items-center">
        Loading...
      </div>
    );

  const { type, id } = activeCall;

  return (
    <div className="str-video__call">
      <div className="str-video__call__header">
        <h4 className="str-video__call__header-title">
          {type}:{id}
        </h4>
        <DeviceSettings />
      </div>
      <SpeakerLayout />
      <div className="relative flex justify-center items-center">
        <CallControls onLeave={() => navigate('/call/lobby')} />
        {children}
      </div>
    </div>
  );
};
