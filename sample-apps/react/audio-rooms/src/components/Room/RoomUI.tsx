import {
  CallingState,
  OwnCapability,
  Restricted,
  SfuModels,
  StreamVideoParticipant,
  useCall,
  useCallStateHooks,
  useHasPermissions,
} from '@stream-io/video-react-sdk';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChatIcon, CloseIcon, ListIcon, PersonIcon } from '../icons';
import { SpeakerElement } from './SpeakerElement';
import { SpeakingRequestsList } from './SpeakingRequestsList';
import { useSpeakingRequests } from '../../hooks/useSpeakingRequests';
import { Listener } from './Listener';
import { LiveRoomControls } from './LiveRoomControls';
import { EndedRoomOverlay, RoomLobby } from './Overlay';
import { RoomListing } from '../RoomList';
import { RoomAccessControls } from './RoomAccessControls';
import type { CustomCallData } from '../../types';
import { RoomListingTabs } from '../RoomList/RoomListingTabs';
import { RoomLiveState } from '../../utils/roomLiveState';

type RoomUIProps = {
  loadRoom: () => Promise<void>;
};

export const RoomUI = ({ loadRoom }: RoomUIProps) => {
  const call = useCall();
  const {
    useCallCustomData,
    useCallCallingState,
    useLocalParticipant,
    useParticipants,
    useCallEndedAt,
    useIsCallLive,
  } = useCallStateHooks();
  const customData = useCallCustomData();
  const endedAt = useCallEndedAt();
  const isLive = useIsCallLive();
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
  } = (customData || {}) as CustomCallData;

  const [showRoomList, setShowRoomList] = useState(false);

  const toggleShowRoomList = useCallback(
    () => setShowRoomList((prev) => !prev),
    [],
  );

  useEffect(() => {
    if (!call || !localParticipant) return;

    const unsubscribeFromLiveEnded = call.on('error', (e) => {
      if (!e.error || e.error.code !== SfuModels.ErrorCode.LIVE_ENDED) {
        return;
      }
      if (!call.permissionsContext.hasPermission(OwnCapability.JOIN_BACKSTAGE))
        loadRoom().catch((err) => {
          console.error('Error loading room', err);
        });
    });

    const unsubscribeFromParticipantLeft = call.on(
      'call.session_participant_left',
      (e) => {
        if (e.participant.user_session_id === localParticipant.sessionId) {
          loadRoom().catch((err) => {
            console.error('Error loading room', err);
          });
        }
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
        StreamVideoParticipant[]
      >,
    );
  }, [hosts, speakerIds, participants]);

  if (!call) return null;

  const showLobby =
    (!canJoinBackstage || (canJoinBackstage && !isLive)) &&
    !endedAt &&
    ![CallingState.JOINED].includes(callingState);

  const isRoomEnded = !!endedAt;

  return (
    <>
      <button
        className="show-room-list-button filled-button filled-button--blue"
        onClick={toggleShowRoomList}
        title={`${showRoomList ? 'Hide' : 'Show'} rooms`}
      >
        {showRoomList ? <CloseIcon /> : <ListIcon />}
        {/*<span>{`${showRoomList ? 'Hide' : 'Show'} rooms`}</span>*/}
      </button>

      <section
        className={`active-room ${showRoomList ? 'with-room-list' : ''}`}
      >
        {showRoomList && <RoomsListing />}
        <div className={`room-detail`}>
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
    </>
  );
};

const RoomsListing = () => {
  const [activeLiveState, setActiveLiveState] = useState<RoomLiveState>('live');

  return (
    <section className={`rooms-overview`}>
      <RoomListingTabs
        activeLiveState={activeLiveState}
        onSelect={setActiveLiveState}
      />
      <RoomListing liveState={activeLiveState} />
    </section>
  );
};
