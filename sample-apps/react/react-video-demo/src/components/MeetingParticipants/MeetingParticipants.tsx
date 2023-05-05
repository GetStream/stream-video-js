import { FC, useEffect, useState } from 'react';
import classnames from 'classnames';
import { Call } from '@stream-io/video-client';
import { StreamVideoParticipant } from '@stream-io/video-react-sdk';
import {
  useLocalParticipant,
  useRemoteParticipants,
} from '@stream-io/video-react-bindings';

import ParticipantsSlider from '../ParticipantsSlider';
import Participant from '../Participant';

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
      setMaxParticipants(2);
    } else {
      setMaxParticipants(maxParticipantsOnScreen);
    }
  }, [breakpoint]);

  if (maxParticipants) {
    const rootClassNames = classnames(styles.root, {
      [styles.slider]: remoteParticipants?.length > maxParticipants,
    });

    const gridClassNames = classnames(styles.meetingGrid, {
      [styles?.[`meetingGrid-${remoteParticipants.length + 1}`]]:
        remoteParticipants?.length <= maxParticipants,
      [styles.slider]: remoteParticipants?.length > maxParticipants,
    });

    return (
      <div className={rootClassNames}>
        <div className={gridClassNames}>
          {localParticipant && (
            <Participant
              call={call}
              className={styles.localParticipant}
              participant={localParticipant}
              sinkId={localParticipant.audioOutputDeviceId}
            />
          )}

          {remoteParticipants?.length <= maxParticipants ? (
            remoteParticipants?.map((participant: StreamVideoParticipant) => {
              return (
                <Participant
                  key={participant.sessionId}
                  call={call}
                  className={styles.remoteParticipant}
                  participant={participant}
                />
              );
            })
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
