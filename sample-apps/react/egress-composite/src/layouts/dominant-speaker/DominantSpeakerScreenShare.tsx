import {
  DefaultParticipantViewUI,
  ParticipantView,
  ParticipantViewUIProps,
  SfuModels,
  useRemoteParticipants,
  Video,
} from '@stream-io/video-react-sdk';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import './ScreenShare.scss';
import { AudioTracks } from './AudioTracks';

const CustomParticipantViewUI = ({ participant }: ParticipantViewUIProps) => (
  <DefaultParticipantViewUI
    participant={participant}
    indicatorsVisible={false}
    showMenuButton={false}
  />
);

export const DominantSpeakerScreenShare = () => {
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
    <>
      <div className="screen-share-container">
        <Video
          className="screen-share-player"
          participant={screenSharingParticipant}
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
          <ParticipantView
            participant={screenSharingParticipant}
            ParticipantViewUI={CustomParticipantViewUI}
          />
        </div>
      </div>
      <AudioTracks
        participants={participants}
        dominantSpeaker={screenSharingParticipant}
      />
    </>
  );
};
