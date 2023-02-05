import {
  CallControls,
  Stage,
  DeviceSettings,
} from '@stream-io/video-react-sdk';

import { useActiveCall } from '@stream-io/video-react-bindings';
import { useNavigate } from 'react-router-dom';
import { usePreviewContext } from './Preview';

export const MeetingUI = () => {
  const activeCall = useActiveCall();
  const navigate = useNavigate();
  const { initialAudioMuted, initialVideoMuted } = usePreviewContext();

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
        <DeviceSettings activeCall={activeCall} />
      </div>
      <Stage call={activeCall} />
      <CallControls
        initialAudioMuted={initialAudioMuted}
        initialVideoMuted={initialVideoMuted}
        call={activeCall}
        onLeave={() => navigate('/call/lobby')}
      />
    </div>

    // <div className={`str-video__call-participants-view ${grid}`}>
    //   {localParticipant && (
    //     <ParticipantBox
    //       participant={localParticipant}
    //       isMuted
    //       call={call}
    //       sinkId={localParticipant.audioOutputDeviceId}
    //     />
    //   )}

    //   {remoteParticipants.map((participant) => (
    //     <ParticipantBox
    //       key={participant.sessionId}
    //       participant={participant}
    //       call={call}
    //       sinkId={localParticipant?.audioOutputDeviceId}
    //     />
    //   ))}
    // </div>
    // <>
    //   <div className="flex h-full w-full">
    //     <div className="h-full w-full flex flex-col justify-center items-center">
    //       <div className="flex h-full w-full justify-center items-center">
    //         <div className="w-3/4">
    //           <ParticipantBox
    //             isMuted
    //             call={activeCall}
    //             sinkId={localParticipant!.audioOutputDeviceId}
    //             participant={localParticipant!}
    //           />
    //         </div>
    //       </div>
    //       <div className="flex h-20">
    //         <CallControls
    //           call={activeCall}
    //           onLeave={() => navigate('/call-lobby')}
    //         />
    //       </div>
    //     </div>
    //     <div className="flex flex-col w-1/4 h-full">
    //       {remoteParticipants?.map((participant) => (
    //         <ParticipantBox
    //           key={participant.sessionId}
    //           participant={participant}
    //           call={activeCall}
    //           sinkId={localParticipant?.audioOutputDeviceId}
    //         />
    //       ))}
    //     </div>
    //   </div>
    // </>
  );
};
