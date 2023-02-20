import {
  ParticipantBox,
  useActiveCall,
  useRemoteParticipants,
} from '@stream-io/video-react-sdk';
import clsx from 'clsx';
import { useEgressReadyWhenAnyParticipantMounts } from '../egressReady';
import './GridView.scss';

export const GridView = () => {
  const activeCall = useActiveCall();
  const participants = useRemoteParticipants();
  const setParticipantVideoRef = useEgressReadyWhenAnyParticipantMounts();

  const totalParticipants = participants.length;
  const widthClassName = clsx(
    totalParticipants <= 1 && 'width--full',
    totalParticipants === 2 && 'width--half',
    totalParticipants === 3 && 'width--one-third',
    totalParticipants >= 4 && totalParticipants < 6 && 'width--half',
    totalParticipants >= 6 && totalParticipants <= 8 && 'width--one-third',
    totalParticipants === 9 && 'width--one-third',
    totalParticipants > 9 && 'width--one-fourth',
  );

  return (
    <div className="grid-view">
      {participants.map((participant, index) => (
        <ParticipantBox
          key={participant.sessionId}
          className={widthClassName}
          participant={participant}
          call={activeCall!}
          indicatorsVisible={false}
          setVideoElementRef={index === 0 ? setParticipantVideoRef : undefined}
        />
      ))}
    </div>
  );
};
