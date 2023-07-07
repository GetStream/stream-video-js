import {
  CallingState,
  OwnCapability,
  Restricted,
  SfuEvents,
  SfuModels,
  StreamVideoEvent,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  useCall,
  useCallCallingState,
  useCallMetadata,
  useHasPermissions,
  useLocalParticipant,
  useParticipants,
} from '@stream-io/video-react-sdk';
import { useEffect, useMemo } from 'react';
import { ChatIcon, PersonIcon } from '../icons';
import { SpeakerElement } from './SpeakerElement';
import { SpeakingRequestsList } from './SpeakingRequestsList';
import { useSpeakingRequests } from '../../hooks/useSpeakingRequests';
import { Listener } from './Listener';
import { LiveRoomControls } from './LiveRoomControls';
import { EndedRoomOverlay, RoomLobby } from './Overlay';
import { RoomListing } from '../RoomList';
import { RoomAccessControls } from './RoomAccessControls';
import { useLayoutController } from '../../contexts';
import type { CustomCallData } from '../../types';

type RoomUIProps = {
  loadRoom: () => Promise<void>;
};

export const RoomUI = ({ loadRoom }: RoomUIProps) => {
  const { showRoomList } = useLayoutController();
  const call = useCall();
  const callMetadata = useCallMetadata();
  const callingState = useCallCallingState();
  const localParticipant = useLocalParticipant();
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

  useEffect(() => {
    if (!call || !localParticipant) return;

    const unsubscribeFromLiveEnded = call.on(
      'error',
      (e: SfuEvents.SfuEvent) => {
        if (
          e.eventPayload.oneofKind !== 'error' ||
          !e.eventPayload.error.error ||
          e.eventPayload.error.error.code !== SfuModels.ErrorCode.LIVE_ENDED
        )
          return;
        if (
          !call.permissionsContext.hasPermission(OwnCapability.JOIN_BACKSTAGE)
        )
          loadRoom();
      },
    );

    const unsubscribeFromParticipantLeft = call.on(
      'call.session_participant_left',
      (e: StreamVideoEvent) => {
        if (e.type !== 'call.session_participant_left') return;

        if (e.user_session_id === localParticipant.sessionId) loadRoom();
      },
    );
    return () => {
      unsubscribeFromLiveEnded();
      unsubscribeFromParticipantLeft();
    };
  }, [loadRoom, call, localParticipant]);

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

  const isRoomEnded = !!callMetadata?.ended_at;

  return (
    <section className="active-room">
      <section className={`rooms-overview ${!showRoomList ? 'hidden' : ''}`}>
        <RoomListing liveState="live" />
        <RoomListing liveState="upcoming" />
        <RoomListing liveState="ended" />
      </section>
      <div className={`room-detail ${showRoomList ? 'with-room-list' : ''}`}>
        <div className="room-detail-header">
          <h2>{title}</h2>
          <LiveRoomControls
            hasNotifications={speakingRequests.length > 0}
            openRequestsList={() => setIsOpenRequestList(true)}
          />
        </div>
        <p className="user-counts secondaryText">
          {participants.length}
          <PersonIcon />/ {speakers.length}
          <ChatIcon />
        </p>
        <section className="participants-section">
          <h3>Speakers ({speakers.length})</h3>
          <div className="speakers-list">
            {speakers.map((speaker) => (
              <SpeakerElement key={speaker.sessionId} speaker={speaker} />
            ))}
          </div>
        </section>
        <section className="participants-section">
          <h3>Listeners ({listeners.length})</h3>
          <div className="listeners-list">
            {listeners.map((listener) => (
              <Listener key={listener.sessionId} participant={listener} />
            ))}
          </div>
        </section>
        <RoomAccessControls />
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
        {isRoomEnded && <EndedRoomOverlay />}
        {showLobby && <RoomLobby />}
      </div>
    </section>
  );
};
