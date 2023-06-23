import { FC, useEffect, useState } from 'react';
import classnames from 'classnames';
import {
  Call,
  SfuModels,
  StreamVideoParticipant,
  useLocalParticipant,
  useParticipants,
} from '@stream-io/video-react-sdk';

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

  const [participantInSpotlight, ...otherParticipants] = useParticipants();

  const breakpoint = useBreakpoint();

  const localParticipantHasVideo = localParticipant?.publishedTracks.includes(
    SfuModels.TrackType.VIDEO,
  );

  useEffect(() => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      setMaxParticipants(2);
    } else {
      setMaxParticipants(maxParticipantsOnScreen);
    }
  }, [breakpoint, maxParticipantsOnScreen]);

  if (maxParticipants) {
    const rootClassNames = classnames(styles.root, {
      [styles.slider]: otherParticipants?.length > maxParticipants,
    });

    const gridClassNames = classnames(styles.meetingGrid, {
      [styles?.[`meetingGrid-${otherParticipants.length + 1}`]]:
        otherParticipants?.length <= maxParticipants,
      [styles.slider]: otherParticipants?.length > maxParticipants,
    });

    const localParticipantClassNames = classnames(styles.localParticipant, {
      [styles.videoDisabled]: !localParticipantHasVideo,
    });

    return (
      <div className={rootClassNames}>
        <div className={gridClassNames}>
          {participantInSpotlight && (
            <Participant
              call={call}
              className={localParticipantClassNames}
              participant={participantInSpotlight}
            />
          )}

          {otherParticipants?.length <= maxParticipants ? (
            otherParticipants?.map((participant: StreamVideoParticipant) => {
              const remoteParticipantHasVideo =
                participant.publishedTracks.includes(SfuModels.TrackType.VIDEO);

              const remoteParticipantsClassNames = classnames(
                styles.remoteParticipant,
                {
                  [styles.videoDisabled]: !remoteParticipantHasVideo,
                },
              );

              return (
                <Participant
                  key={participant.sessionId}
                  call={call}
                  className={remoteParticipantsClassNames}
                  participant={participant}
                />
              );
            })
          ) : (
            <div className={styles.slider}>
              <ParticipantsSlider
                call={call}
                mode="horizontal"
                participants={otherParticipants}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
};
