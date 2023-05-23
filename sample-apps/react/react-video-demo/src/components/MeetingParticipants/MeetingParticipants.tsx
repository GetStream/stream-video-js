import { FC, useEffect, useState } from 'react';
import classnames from 'classnames';
import {
  Call,
  useLocalParticipant,
  useRemoteParticipants,
  StreamVideoParticipant,
  useParticipants,
} from '@stream-io/video-react-sdk';

import { SfuModels } from '@stream-io/video-client';

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

  const [participantInSpotlight, ...otherParticipants] = useParticipants();

  const breakpoint = useBreakpoint();

  const localParticpantHasVideo = localParticipant?.publishedTracks.includes(
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
      [styles.slider]: remoteParticipants?.length > maxParticipants,
    });

    const gridClassNames = classnames(styles.meetingGrid, {
      [styles?.[`meetingGrid-${remoteParticipants.length + 1}`]]:
        remoteParticipants?.length <= maxParticipants,
      [styles.slider]: remoteParticipants?.length > maxParticipants,
    });

    const localParticipantClassNames = classnames(styles.localParticipant, {
      [styles.videoDisabled]: !localParticpantHasVideo,
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

          {remoteParticipants?.length <= maxParticipants ? (
            remoteParticipants?.map((participant: StreamVideoParticipant) => {
              const remoteParticpantHasVideo =
                participant.publishedTracks.includes(SfuModels.TrackType.VIDEO);

              const remoteParticipantsClassNames = classnames(
                styles.remoteParticipant,
                {
                  [styles.videoDisabled]: !remoteParticpantHasVideo,
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
