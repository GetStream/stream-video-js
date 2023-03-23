import { FC, useState } from 'react';
import classnames from 'classnames';

import { SfuModels, StreamVideoParticipant } from '@stream-io/video-client';
import { useConnectedUser } from '@stream-io/video-react-bindings';

import Panel from '../Panel';
import { MicMuted, Mic, Video, VideoOff, Search } from '../Icons';

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
  participants?: StreamVideoParticipant[];
  isFocused?: boolean;
};

export const ParticipantsPanel: FC<Props> = ({
  isFocused,
  className,
  participants,
}) => {
  const [value, setValue]: any = useState(undefined);
  const connectedUser = useConnectedUser();

  const rootClassname = classnames(styles.root, className);

  return (
    <Panel
      className={rootClassname}
      title={
        <>
          Participants{' '}
          <span className={styles.amount}>{`(${participants?.length})`}</span>
        </>
      }
      isFocused={isFocused}
      canCollapse={true}
    >
      <div className={styles.search}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search"
          onBlur={(e) => setValue(e.currentTarget.value)}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <Search className={styles.searchIcon} />
      </div>
      <ul>
        {participants?.map((participant: any, index: number) => {
          const particpantName = String(participant?.user?.name).toLowerCase();
          const searchValue = value?.toLowerCase();

          const isLocalParticipant =
            participant?.userId === connectedUser?.id
              ? import.meta.env.VITE_VIDEO_USER_ID
              : '';

          const isAudioOn = participant.publishedTracks.includes(
            SfuModels.TrackType.AUDIO,
          );
          const isVideoOn = participant.publishedTracks.includes(
            SfuModels.TrackType.VIDEO,
          );

          if (
            value === undefined ||
            value === null ||
            particpantName.startsWith(searchValue)
          ) {
            return (
              <li className={styles.participant} key={`participant-${index}`}>
                {isLocalParticipant ? connectedUser?.name : participant?.name}
                {!isLocalParticipant ? (
                  <div className={styles.media}>
                    {isAudioOn ? (
                      <Mic className={styles.mic} />
                    ) : (
                      <MicMuted className={styles.micMuted} />
                    )}
                    {isVideoOn ? (
                      <Video className={styles.video} />
                    ) : (
                      <VideoOff className={styles.videoOff} />
                    )}
                  </div>
                ) : null}
              </li>
            );
          }
          return null;
        })}
      </ul>
    </Panel>
  );
};
