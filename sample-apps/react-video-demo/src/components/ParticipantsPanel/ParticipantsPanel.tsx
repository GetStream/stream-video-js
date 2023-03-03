import { FC, useState, useEffect, useCallback } from 'react';
import classnames from 'classnames';

import Panel from '../Panel';
import { MicMuted, Mic, Search } from '../Icons';

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
  participants?: any;
  isFocused?: boolean;
};

export const ParticipantsPanel: FC<Props> = ({
  isFocused,
  className,
  participants,
}) => {
  const [value, setValue]: any = useState(undefined);

  const rootClassname = classnames(styles.root, className);

  return (
    <Panel
      className={rootClassname}
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
    </Panel>
  );
};
