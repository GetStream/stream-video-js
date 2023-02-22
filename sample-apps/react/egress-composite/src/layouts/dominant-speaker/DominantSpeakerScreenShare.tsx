import {
  ActiveCallVideo,
  ParticipantBox,
  SfuModels,
  useActiveCall,
  useRemoteParticipants,
} from '@stream-io/video-react-sdk';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import './ScreenShare.scss';

export const DominantSpeakerScreenShare = () => {
  const call = useActiveCall();
  const participants = useRemoteParticipants();
  const screenSharingParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  const setParticipantVideoRef = useEgressReadyWhenAnyParticipantMounts(
    screenSharingParticipant!,
    SfuModels.TrackType.SCREEN_SHARE,
  );

  if (!screenSharingParticipant) return <h2>No active screen share</h2>;

  return (
    <div className="screen-share-container">
      <ActiveCallVideo
        className="screen-share-player"
        participant={screenSharingParticipant}
        call={call!}
        kind="screen"
        autoPlay
        muted
        setVideoElementRef={setParticipantVideoRef}
      />
      <span>
        Presenter:{' '}
        {screenSharingParticipant.name || screenSharingParticipant.userId}
      </span>
      <div className="current-speaker">
        <ParticipantBox
          participant={screenSharingParticipant}
          call={call!}
          indicatorsVisible={false}
        />
      </div>
    </div>
  );
};
