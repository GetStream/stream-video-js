import {
  CallingState,
  OwnCapability,
  Restricted,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  useCall,
  useCallCallingState,
  useCallMetadata,
  useHasPermissions,
  useParticipants,
} from '@stream-io/video-react-sdk';
import { useMemo } from 'react';
import RoomList from '../../pages/RoomList';
import { ChatIcon, PersonIcon } from '../icons';
import SpeakerElement from './SpeakerElement';
import { CustomCallData } from '../../data/audioRoom';
import SpeakingRequestsList from './SpeakingRequestsList';
import { useSpeakingRequests } from '../../hooks/useSpeakingRequests';
import { Listener } from './Listener';
import { LiveRoomControls } from './LiveRoomControls';
import { EndedRoomOverlay, RoomLobby } from './Overlay';
import { RoomNavControls } from './RoomNavControls';

export const RoomUI = () => {
  const call = useCall();
  const callMetadata = useCallMetadata();
  const callingState = useCallCallingState();
  const participants = useParticipants();
  const canJoinBackstage = useHasPermissions(OwnCapability.JOIN_BACKSTAGE);
  const {
    isOpenRequestList,
    dismissSpeakingRequest,
    setIsOpenRequestList,
    speakingRequests,
  } = useSpeakingRequests();
  const {
    title,
    hosts = [],
    speakerIds = [],
  } = (callMetadata?.custom || {}) as CustomCallData;

  const { speakers, listeners } = useMemo(() => {
    const hostIds = hosts.map((host) => host.id) || [];
    return participants.reduce(
      (acc, p) => {
        if (hostIds?.includes(p.userId) || speakerIds.includes(p.userId)) {
          acc.speakers.push(p);
        } else {
          acc.listeners.push(p);
        }
        return acc;
      },
      { speakers: [], listeners: [] } as Record<
        string,
        (StreamVideoParticipant | StreamVideoLocalParticipant)[]
      >,
    );
  }, [hosts, speakerIds, participants]);

  if (!call) return null;

  const showLobby =
    (!canJoinBackstage || (canJoinBackstage && !callMetadata?.backstage)) &&
    !callMetadata?.ended_at &&
    ![CallingState.JOINED].includes(callingState);

  return (
    <section className="active-room">
      <RoomList />
      <div className="room-detail">
        <div className="room-detail-header">
          <h2>{title}</h2>
          <LiveRoomControls
            hasNotifications={speakingRequests.length > 0}
            openRequestsList={() => setIsOpenRequestList(true)}
          />
        </div>
        <p className="user-counts secondaryText">
          {participants.length}
          <PersonIcon />/ {speakers.length ?? 0}
          <ChatIcon />
        </p>
        <section className="participants-section">
          <h3>Speakers ({speakers.length ?? 0})</h3>
          <div className="speakers-list">
            {speakers.map((speaker) => (
              <SpeakerElement key={speaker.userId} speaker={speaker} />
            ))}
          </div>
        </section>
        <section className="participants-section">
          <h3>Listeners ({listeners.length ?? 0})</h3>
          <div className="listeners-list">
            {listeners.map((listener) => (
              <Listener key={listener.userId} participant={listener} />
            ))}
          </div>
        </section>
        <RoomNavControls />
        {isOpenRequestList && (
          <Restricted
            requiredGrants={[OwnCapability.UPDATE_CALL_PERMISSIONS]}
            hasPermissionsOnly
          >
            <SpeakingRequestsList
              close={() => setIsOpenRequestList(false)}
              dismissSpeakingRequest={dismissSpeakingRequest}
              speakingRequests={speakingRequests}
            />
          </Restricted>
        )}
        {!!callMetadata?.ended_at && <EndedRoomOverlay />}
        {showLobby && <RoomLobby call={call} />}
      </div>
    </section>
  );
};
