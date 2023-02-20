<<<<<<< HEAD
import { FC, useState, useEffect, useCallback } from 'react';
import classnames from 'classnames';

import Panel from '../Panel';
import { MicMuted, Mic, Search } from '../Icons';
=======
import { FC } from 'react';
import classnames from 'classnames';

import Panel from '../Panel';
>>>>>>> 23e45e0 (feat: participants panel)

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
<<<<<<< HEAD
  participants?: any;
=======
  participants: any[];
>>>>>>> 23e45e0 (feat: participants panel)
  isFocused?: boolean;
};

export const ParticipantsPanel: FC<Props> = ({
<<<<<<< HEAD
  isFocused,
  className,
  participants,
}) => {
  const [value, setValue]: any = useState(undefined);

=======
  participants,
  isFocused,
  className,
}) => {
>>>>>>> 23e45e0 (feat: participants panel)
  const rootClassname = classnames(styles.root, className);

  return (
    <Panel
      className={rootClassname}
<<<<<<< HEAD
      title={
        <>
          Participants{' '}
          <span className={styles.amount}>{`(${participants.length})`}</span>
        </>
      }
      isFocused={isFocused}
      canCollapse={true}
    >
      <div className={styles.search}>
        <input
          className={styles.input}
          type="text"
          onBlur={(e) => setValue(e.currentTarget.value)}
          onChange={(e) => setValue(e.currentTarget.value)}
        />
        <Search className={styles.searchIcon} />
      </div>
      <ul>
        {participants.map((participant: any, index: number) => {
          const particpantName = String(participant?.user?.name).toLowerCase();
          const searchValue = value?.toLowerCase();

          if (
            value === undefined ||
            value === null ||
            particpantName.startsWith(searchValue)
          ) {
            return (
              <li className={styles.participant} key={`participant-${index}`}>
                {participant?.user?.name}
                {'audioStream' in participant ? (
                  <Mic className={styles.mic} />
                ) : (
                  <MicMuted className={styles.micMuted} />
                )}
              </li>
            );
          }
          return null;
        })}
      </ul>
=======
      title="Participants"
      isFocused={isFocused}
      canCollapse={true}
    >
      <></>
>>>>>>> 23e45e0 (feat: participants panel)
    </Panel>
  );
};
