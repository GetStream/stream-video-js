import { useCallback, useState } from 'react';
import classnames from 'classnames';

import { StreamVideoParticipant } from '@stream-io/video-react-sdk';

import { AnimatedPanel } from '../Panel';
import { Invite } from '../InvitePanel';
import { Close, Search } from '../Icons';
import { ParticipantListItem } from './ParticipantListItem';
import { useSearch } from '../../hooks/useSearch';

import styles from './ParticipantsPanel.module.css';
import { usePanelContext } from '../../contexts/PanelContext';

type ParticipantsPanelTitleProps = {
  participants: StreamVideoParticipant[];
};

const ParticipantsPanelTitle = ({
  participants,
}: ParticipantsPanelTitleProps) => (
  <>
    Participants{' '}
    <span className={styles.amount}>{`(${participants?.length})`}</span>
  </>
);

export type ParticipantsPanelProps = {
  className?: string;
  participants?: StreamVideoParticipant[];
  isFocused?: boolean;
  callId: string;
};

export const ParticipantsPanel = ({
  isFocused,
  className,
  participants = [],
  callId,
}: ParticipantsPanelProps) => {
  const { participantsPanelVisibility, toggleCollapse } = usePanelContext();
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

  const participantsToList = (searchQuery ? searchResults : participants) ?? [];

  return (
    <AnimatedPanel
      className={rootClassname}
      title={<ParticipantsPanelTitle participants={participants} />}
      isFocused={isFocused}
      toggleCollapse={() => toggleCollapse('participant-list')}
      visibility={participantsPanelVisibility}
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
        {!participantsToList.length ? (
          <p>No matches found</p>
        ) : (
          participantsToList.map((participant) => {
            return (
              <li className={styles.participant} key={participant.sessionId}>
                <ParticipantListItem participant={participant} />
              </li>
            );
          })
        )}
      </ul>

      <div className={styles.invite}>
        <Invite callId={callId} canShare />
      </div>
    </AnimatedPanel>
  );
};

export const ParticipantsPanelSmallScreen = ({
  participants = [],
  callId,
}: ParticipantsPanelProps) => {
  const { toggleHide } = usePanelContext();
  const [searchQuery, setSearchQuery]: any = useState(undefined);

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

  const participantsToList = (searchQuery ? searchResults : participants) ?? [];

  return (
    <div className={styles['participants-panel-small-screen']}>
      <div className={styles['participants-panel-small-screen__float']}>
        <div className={styles['participants-panel-small-screen__header']}>
          <div
            className={styles['participants-panel-small-screen__header__title']}
          >
            <ParticipantsPanelTitle participants={participants} />
          </div>
          <button onClick={() => toggleHide('participant-list')}>
            <Close />
          </button>
        </div>
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
          {!participantsToList.length ? (
            <p>No matches found</p>
          ) : (
            participantsToList.map((participant) => {
              return (
                <li className={styles.participant} key={participant.sessionId}>
                  <ParticipantListItem participant={participant} />
                </li>
              );
            })
          )}
        </ul>

        <div className={styles.invite}>
          <Invite callId={callId} canShare />
        </div>
      </div>
    </div>
  );
};
