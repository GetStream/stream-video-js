import { FC, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Call } from '@stream-io/video-client';
import { ParticipantBox } from '@stream-io/video-react-sdk';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';

import ParticipantsSlider from '../ParticipantsSlider';

import { useBreakpoint } from '../../hooks/useBreakpoints';

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
  const [maxParticipants, setMaxParticipants] = useState<number>();
  const localParticipant = useLocalParticipant();
  const remoteParticipants = useRemoteParticipants();

  const breakpoint = useBreakpoint();

  useEffect(() => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      setMaxParticipants(3);
    } else {
      setMaxParticipants(maxParticipantsOnScreen);
    }
  }, [breakpoint]);

  if (maxParticipants) {
    const gridClassNames = classnames(styles.meetingGrid, {
      [styles?.[`meetingGrid-${remoteParticipants.length + 1}`]]:
        remoteParticipants?.length <= maxParticipants,
      [styles.slider]: remoteParticipants?.length > maxParticipants,
    });

    return (
      <div className={styles.root}>
        <div className={gridClassNames}>
          {localParticipant && (
            <ParticipantBox
              className={styles.localParticipant}
              participant={localParticipant}
              call={call}
              sinkId={localParticipant.audioOutputDeviceId}
            />
          )}

          {remoteParticipants?.length <= maxParticipants ? (
            remoteParticipants?.map((participant: any) => (
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
      </div>
    );
  }

  return null;
};
