import {
  DefaultParticipantViewUI,
  ParticipantView,
  SfuModels,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import { AudioTracks } from './AudioTracks';

import './DominantSpeakerScreenShare.scss';

export const DominantSpeakerScreenShare = () => {
  const { useRemoteParticipants } = useCallStateHooks();
  const participants = useRemoteParticipants();

  const screensharingParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE),
  )!;

  const { setVideoElement, setVideoPlaceholderElement } =
    useEgressReadyWhenAnyParticipantMounts(
      screensharingParticipant!,
      SfuModels.TrackType.SCREEN_SHARE,
    );

  return (
    <div className="eca__dominant-speaker-screen-share__container">
      <AudioTracks
        participants={participants}
        dominantSpeaker={screensharingParticipant}
      />
      <ParticipantView
        participant={screensharingParticipant}
        trackType="screenShareTrack"
        refs={{ setVideoElement, setVideoPlaceholderElement }}
        ParticipantViewUI={null}
      />
      <span>
        {`Presenter: ${
          screensharingParticipant.name || screensharingParticipant.userId
        }`}
      </span>
      <div className="eca__dominant-speaker-screen-share__current-speaker">
        <ParticipantView
          participant={screensharingParticipant}
          ParticipantViewUI={
            <DefaultParticipantViewUI
              indicatorsVisible={false}
              showMenuButton={false}
            />
          }
        />
      </div>
    </div>
  );
};
