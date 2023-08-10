import { FC, useCallback, useState } from 'react';
import classnames from 'classnames';

import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

import { AnimatedPanel } from '../Panel';
import { Invite } from '../InvitePanel';
import { Search } from '../Icons';
import { ParticipantListItem } from './ParticipantListItem';
import { useSearch } from '../../hooks/useSearch';

import styles from './ParticipantsPanel.module.css';

export type Props = {
  className?: string;
  participants?: StreamVideoParticipant[];
  isFocused?: boolean;
  callId: string;
  close?: () => void;
  fulllHeight?: boolean;
  visible: boolean;
};

export const ParticipantsPanel: FC<Props> = ({
  isFocused,
  close,
  className,
  participants = [],
  callId,
  fulllHeight,
  visible,
}) => {
  const [searchQuery, setSearchQuery]: any = useState(undefined);

  const rootClassname = classnames(styles.root, className);

  const activeUsersSearchFn = useCallback(
    (queryString: string) => {
      const queryRegExp = new RegExp(queryString, 'i');
      return Promise.resolve(
        (participants || []).filter((participant) => {
          return participant.name.match(queryRegExp);
        }),
      );
    },
    [participants],
  );

  const { searchResults } = useSearch<StreamVideoParticipant>({
    searchFn: activeUsersSearchFn,
    debounceInterval: 0,
    searchQuery,
  });

  return (
    <AnimatedPanel
      className={rootClassname}
      visible={visible}
      title={
        <>
          Participants{' '}
          <span className={styles.amount}>{`(${participants?.length})`}</span>
        </>
      }
      isFocused={isFocused}
      canCollapse={true}
      fulllHeight={fulllHeight}
      close={close}
      isParticipantsPanel
    >
      <div className={styles.search}>
        <input
          className={styles.input}
          type="text"
          placeholder="Search"
          onBlur={(e) => setSearchQuery(e.currentTarget.value)}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
        <Search className={styles.searchIcon} />
      </div>

      <ul className={styles.participants}>
        {(searchQuery ? searchResults : participants).map((participant) => {
          return (
            <li className={styles.participant} key={participant.sessionId}>
              <ParticipantListItem participant={participant} />
            </li>
          );
        })}
      </ul>

      <div className={styles.invite}>
        <Invite callId={callId} canShare />
      </div>
    </AnimatedPanel>
  );
};
