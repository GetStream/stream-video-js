import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';
import { useActiveCall } from '@stream-io/video-react-bindings';
import {
  DeviceSettings,
  LoadingIndicator,
  CallParticipantsList,
  Stage,
  CallControls,
  ToggleParticipantListButton,
} from '@stream-io/video-react-sdk';

export const MeetingUI = () => {
  const router = useRouter();
  const activeCall = useActiveCall();
  const [showParticipants, setShowParticipants] = useState(false);
  const onLeave = useCallback(() => {
    router.push('/');
  }, [router]);

  const toggleParticipantList = useCallback(
    () => setShowParticipants((prev) => !prev),
    [],
  );

  const hideParticipantList = useCallback(() => setShowParticipants(false), []);

  if (!activeCall)
    return (
      <div className=" str-video str-video__call">
        <div className="str-video__call__loading-screen">
          <LoadingIndicator />
        </div>
      </div>
    );

  const { type, id } = activeCall.data.call;
  const showSidebar = showParticipants;

  return (
    <div className=" str-video str-video__call">
      <div className="str-video__call__main">
        <div className="str-video__call__header">
          <h4 className="str-video__call__header-title">
            {type}:{id}
          </h4>
          <DeviceSettings activeCall={activeCall} />
        </div>
        <Stage call={activeCall} />
        <CallControls
          call={activeCall}
          onLeave={onLeave}
          toggleShowParticipantList={toggleParticipantList}
        >
          <ToggleParticipantListButton
            enabled={showParticipants}
            onClick={toggleParticipantList}
          />
        </CallControls>
      </div>
      {showSidebar && (
        <div className="str-video__sidebar">
          {showParticipants && (
            <CallParticipantsList onClose={hideParticipantList} />
          )}
        </div>
      )}
    </div>
  );
};
