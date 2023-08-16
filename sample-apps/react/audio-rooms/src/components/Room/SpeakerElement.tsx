import {
  Audio,
  Avatar,
  OwnCapability,
  SfuModels,
  StreamVideoLocalParticipant,
  StreamVideoParticipant,
  useCall,
  useCallStateHooks,
  useHasPermissions,
} from '@stream-io/video-react-sdk';
import { CloseIcon, MuteMicrophoneIcon } from '../icons';
import type { CustomCallData } from '../../types';

export const SpeakerElement = ({
  speaker,
}: {
  speaker: StreamVideoParticipant | StreamVideoLocalParticipant;
}) => {
  const call = useCall();
  const { useCallCustomData } = useCallStateHooks();
  const customData = useCallCustomData();
  const canMuteUsers = useHasPermissions(OwnCapability.MUTE_USERS);

  if (!call) return null;

  const { hosts = [] } = (customData || {}) as CustomCallData;
  const isAudioEnabled = speaker.publishedTracks.includes(
    SfuModels.TrackType.AUDIO,
  );
  const isSpeakerHost = hosts.find((host) => host.id === speaker.userId);
  const displayName = speaker.name || speaker.userId;
  return (
    <div className="speaker-container">
      <Audio muted={!isAudioEnabled} audioStream={speaker.audioStream}></Audio>
      <div className="speaker-image-container">
        <Avatar
          className={`speaker-image ${
            speaker.isSpeaking ? 'speaking-indicator' : ''
          }`}
          name={displayName}
          src={speaker.image}
          alt={displayName}
        />
        <div className="speaker-container__controls">
          {!isSpeakerHost && canMuteUsers && (
            <button
              title="Remove from speakers"
              onClick={() => {
                call.updateUserPermissions({
                  user_id: speaker.userId,
                  revoke_permissions: [OwnCapability.SEND_AUDIO],
                });
                call.update({
                  custom: {
                    ...(customData || {}),
                    speakerIds: [
                      (customData.speakersIds || []).filter(
                        (id: string) => id === speaker.userId,
                      ),
                    ],
                  },
                });
              }}
            >
              <CloseIcon />
            </button>
          )}
        </div>
        {!isAudioEnabled && <MuteMicrophoneIcon />}
      </div>

      <div className="speaker-name">
        <span>{displayName}</span>
      </div>
    </div>
  );
};

export default SpeakerElement;
