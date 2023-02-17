import {
  ParticipantBox,
  SfuModels,
  useActiveCall,
  useRemoteParticipants,
  Video,
} from '@stream-io/video-react-sdk';
import { LayoutComponent } from '../index';
import './ScreenShare.scss';

export const DominantSpeakerScreenShare: LayoutComponent = (props) => {
  const { setVideoElementRef } = props;
  const call = useActiveCall();
  const participants = useRemoteParticipants();
  const screenSharingParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );
  if (!screenSharingParticipant) return <h2>No active screen share</h2>;

  return (
    <div className="screen-share-container">
      <Video
        className="screen-share-player"
        participant={screenSharingParticipant}
        call={call!}
        kind="screen"
        autoPlay
        muted
        setVideoElementRef={setVideoElementRef}
      />
      <span>
        Presenter:{' '}
        {screenSharingParticipant.user?.name || screenSharingParticipant.userId}
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
