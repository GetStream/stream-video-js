import {
  DefaultParticipantViewUI,
  hasScreenShare,
  ParticipantsAudio,
  ParticipantView,
  SfuModels,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';

import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import { useConfigurationContext } from '../../../ConfigurationContext';

import './DominantSpeakerScreenShare.scss';

export const DominantSpeakerScreenShare = () => {
  const { useRemoteParticipants } = useCallStateHooks();
  const participants = useRemoteParticipants();

  const screensharingParticipant = participants.find((p) => hasScreenShare(p))!;

  const { setVideoElement, setVideoPlaceholderElement } =
    useEgressReadyWhenAnyParticipantMounts(
      screensharingParticipant!,
      SfuModels.TrackType.SCREEN_SHARE,
    );

  const {
    options: {
      'layout.single-participant.presenter_visible': presenterVisible = true,
    },
  } = useConfigurationContext();

  return (
    <div
      className="eca__dominant-speaker-screen-share__container"
      data-testid="single-participant"
    >
      <ParticipantsAudio participants={participants} />
      <ParticipantView
        participant={screensharingParticipant}
        trackType="screenShareTrack"
        refs={{ setVideoElement, setVideoPlaceholderElement }}
        muteAudio // audio is handled by <ParticipantsAudio />
        ParticipantViewUI={null}
      />
      {presenterVisible && (
        <div className="eca__dominant-speaker-screen-share__current-speaker">
          <ParticipantView
            participant={screensharingParticipant}
            muteAudio // audio is handled by <ParticipantsAudio />
            ParticipantViewUI={
              <DefaultParticipantViewUI
                indicatorsVisible={false}
                showMenuButton={false}
              />
            }
          />
        </div>
      )}
    </div>
  );
};
