import { ParticipantsAudio } from '../../Audio';
import { useRawRemoteParticipants } from '../hooks';

export const Host = () => {
  const remoteParticipants = useRawRemoteParticipants();
  return <ParticipantsAudio participants={remoteParticipants} />;
};

Host.displayName = 'PipLayout.Host';
