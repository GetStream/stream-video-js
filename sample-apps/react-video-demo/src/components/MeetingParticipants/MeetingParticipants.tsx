import { FC } from 'react';
import classnames from 'classnames';
import { Call } from '@stream-io/video-client';
import { ParticipantBox } from '@stream-io/video-react-sdk';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';

import ParticipantsSlider from '../ParticipantsSlider';

import styles from './MeetingParticipants.module.css';

export type Props = {
  className?: string;
  call: Call;
  maxParticipantsOnScreen?: number;
};

export const MeetingParticipants: FC<Props> = ({
  call,
  maxParticipantsOnScreen = 8,
}) => {
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const gridClassNames = classnames(styles.meetingGrid, {
    [styles?.[`meetingGrid-${remoteParticipants.length + 1}`]]:
      remoteParticipants?.length <= maxParticipantsOnScreen,
    [styles.slider]: remoteParticipants?.length > maxParticipantsOnScreen,
  });

  return (
    <div className={gridClassNames}>
      {localParticipant && (
        <ParticipantBox
          className={styles.localParticipant}
          participant={localParticipant}
          call={call}
          sinkId={localParticipant.audioOutputDeviceId}
        />
      )}

      {remoteParticipants?.length <= maxParticipantsOnScreen ? (
        remoteParticipants.map((participant) => (
          <ParticipantBox
            className={styles.remoteParticipant}
            key={participant.sessionId}
            participant={participant}
            call={call}
            sinkId={localParticipant?.audioOutputDeviceId}
          />
        ))
      ) : (
        <div className={styles.slider}>
          <ParticipantsSlider
            call={call}
            mode="horizontal"
            participants={remoteParticipants}
          />
        </div>
      )}
    </div>
  );
};
