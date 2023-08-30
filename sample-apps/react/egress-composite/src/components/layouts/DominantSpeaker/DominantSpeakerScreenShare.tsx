import {
  DefaultParticipantViewUI,
  ParticipantView,
  SfuModels,
  useCallStateHooks,
  Video,
} from '@stream-io/video-react-sdk';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import './DominantSpeakerScreenShare.scss';
import { AudioTracks } from './AudioTracks';

export const DominantSpeakerScreenShare = () => {
  const { useRemoteParticipants } = useCallStateHooks();
  const participants = useRemoteParticipants();
  const screenSharingParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  );

  const { setVideoElement, setVideoPlaceholderElement } =
    useEgressReadyWhenAnyParticipantMounts(
      screenSharingParticipant!,
      SfuModels.TrackType.SCREEN_SHARE,
    );

  if (!screenSharingParticipant) return <h2>No active screen share</h2>;

  return (
    <>
      <div className="dominant-speaker-screen-share__container">
        <Video
          className="dominant-speaker-screen-share__player"
          participant={screenSharingParticipant}
          trackType="screenShareTrack"
          autoPlay
          muted
          refs={{ setVideoElement, setVideoPlaceholderElement }}
        />
        <span>
          Presenter:{' '}
          {screenSharingParticipant.name || screenSharingParticipant.userId}
        </span>
        <div className="dominant-speaker-screen-share__current-speaker">
          <ParticipantView
            participant={screenSharingParticipant}
            ParticipantViewUI={
              <DefaultParticipantViewUI
                indicatorsVisible={false}
                showMenuButton={false}
              />
            }
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
