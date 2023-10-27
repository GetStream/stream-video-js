import {
  ComponentProps,
  Dispatch,
  ForwardedRef,
  forwardRef,
  SetStateAction,
  useCallback,
  useState,
} from 'react';
import {
  Restricted,
  useCall,
  useCallStateHooks,
} from '@stream-io/video-react-bindings';
import {
  name,
  OwnCapability,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import clsx from 'clsx';

import { BlockedUserListing } from './BlockedUserListing';
import {
  CopyToClipboardButtonWithPopup,
  IconButton,
  TextButton,
} from '../Button';
import { CallParticipantListHeader } from './CallParticipantListHeader';
import { CallParticipantListing } from './CallParticipantListing';
import { EmptyParticipantSearchList } from './EmptyParticipantSearchList';
import { LoadingIndicator } from '../LoadingIndicator';
import { SearchInput, SearchResults } from '../Search';
import { useSearch, UseSearchParams } from '../Search/hooks';
import {
  GenericMenu,
  GenericMenuButtonItem,
  MenuToggle,
  ToggleMenuButtonProps,
} from '../Menu';

type CallParticipantListProps = {
  /** Click event listener function to be invoked in order to dismiss/hide the CallParticipantsList from the UI */
  onClose: () => void;
  /** Custom function to override the searching logic of active participants */
  activeUsersSearchFn?: UseSearchParams<StreamVideoParticipant>['searchFn'];
  /** Custom function to override the searching logic of blocked users */
  blockedUsersSearchFn?: UseSearchParams<string>['searchFn'];
  /** Interval in ms, during which the participant search calls will be debounced. The default value is 200ms. */
  debounceSearchInterval?: number;
};

const UserListTypes = {
  active: 'Active users',
  blocked: 'Blocked users',
} as const;

const DEFAULT_DEBOUNCE_SEARCH_INTERVAL = 200 as const;

export const CallParticipantsList = ({
  onClose,
  activeUsersSearchFn,
  blockedUsersSearchFn,
  debounceSearchInterval,
}: CallParticipantListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userListType, setUserListType] =
    useState<keyof typeof UserListTypes>('active');

  const exitSearch = useCallback(() => setSearchQuery(''), []);

  return (
    <div className="str-video__participant-list">
      <CallParticipantListHeader onClose={onClose} />
      <SearchInput
        value={searchQuery}
        onChange={({ currentTarget }) => setSearchQuery(currentTarget.value)}
        exitSearch={exitSearch}
        isActive={!!searchQuery}
      />
      <CallParticipantListContentHeader
        userListType={userListType}
        setUserListType={setUserListType}
      />
      <div className="str-video__participant-list__content">
        {userListType === 'active' && (
          <ActiveUsersSearchResults
            searchQuery={searchQuery}
            activeUsersSearchFn={activeUsersSearchFn}
            debounceSearchInterval={debounceSearchInterval}
          />
        )}
        {userListType === 'blocked' && (
          <BlockedUsersSearchResults
            searchQuery={searchQuery}
            blockedUsersSearchFn={blockedUsersSearchFn}
            debounceSearchInterval={debounceSearchInterval}
          />
        )}
      </div>
      <div className="str-video__participant-list__footer">
        <CopyToClipboardButtonWithPopup
          Button={InviteLinkButton}
          copyValue={typeof window !== 'undefined' ? window.location.href : ''}
        />
      </div>
    </div>
  );
};

const CallParticipantListContentHeader = ({
  userListType,
  setUserListType,
}: {
  userListType: keyof typeof UserListTypes;
  setUserListType: Dispatch<SetStateAction<keyof typeof UserListTypes>>;
}) => {
  const call = useCall();

  const muteAll = () => {
    call?.muteAllUsers('audio');
  };

  return (
    <div className="str-video__participant-list__content-header">
      <div className="str-video__participant-list__content-header-title">
        <span>{UserListTypes[userListType]}</span>
        {userListType === 'active' && (
          <Restricted
            requiredGrants={[OwnCapability.MUTE_USERS]}
            hasPermissionsOnly
          >
            <TextButton onClick={muteAll}>Mute all</TextButton>
          </Restricted>
        )}
      </div>
      <MenuToggle placement="bottom-end" ToggleButton={ToggleButton}>
        <GenericMenu>
          {(
            Object.keys(UserListTypes) as Array<keyof typeof UserListTypes>
          ).map((lt) => (
            <GenericMenuButtonItem
              key={lt}
              aria-selected={lt === userListType}
              onClick={() => setUserListType(lt)}
            >
              {UserListTypes[lt]}
            </GenericMenuButtonItem>
          ))}
        </GenericMenu>
      </MenuToggle>
    </div>
  );
};

const ActiveUsersSearchResults = ({
  searchQuery,
  activeUsersSearchFn: activeUsersSearchFnFromProps,
  debounceSearchInterval = DEFAULT_DEBOUNCE_SEARCH_INTERVAL,
}: Pick<
  CallParticipantListProps,
  'activeUsersSearchFn' | 'debounceSearchInterval'
> & { searchQuery: string }) => {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants({ sortBy: name });

  const activeUsersSearchFn = useCallback(
    (queryString: string) => {
      const queryRegExp = new RegExp(queryString, 'i');
      return Promise.resolve(
        participants.filter((participant) => {
          return participant.name.match(queryRegExp);
        }),
      );
    },
    [participants],
  );

  const { searchQueryInProgress, searchResults } =
    useSearch<StreamVideoParticipant>({
      searchFn: activeUsersSearchFnFromProps ?? activeUsersSearchFn,
      debounceInterval: debounceSearchInterval,
      searchQuery,
    });

  return (
    <SearchResults<StreamVideoParticipant>
      EmptySearchResultComponent={EmptyParticipantSearchList}
      LoadingIndicator={LoadingIndicator}
      searchQueryInProgress={searchQueryInProgress}
      searchResults={searchQuery ? searchResults : participants}
      SearchResultList={CallParticipantListing}
    />
  );
};

const BlockedUsersSearchResults = ({
  blockedUsersSearchFn: blockedUsersSearchFnFromProps,
  debounceSearchInterval = DEFAULT_DEBOUNCE_SEARCH_INTERVAL,
  searchQuery,
}: Pick<
  CallParticipantListProps,
  'blockedUsersSearchFn' | 'debounceSearchInterval'
> & { searchQuery: string }) => {
  const { useCallBlockedUserIds } = useCallStateHooks();
  const blockedUsers = useCallBlockedUserIds();

  const blockedUsersSearchFn = useCallback(
    (queryString: string) => {
      const queryRegExp = new RegExp(queryString, 'i');
      return Promise.resolve(
        blockedUsers.filter((blockedUser) => {
          return blockedUser.match(queryRegExp);
        }),
      );
    },
    [blockedUsers],
  );

  const { searchQueryInProgress, searchResults } = useSearch<string>({
    searchFn: blockedUsersSearchFnFromProps ?? blockedUsersSearchFn,
    debounceInterval: debounceSearchInterval,
    searchQuery,
  });

  return (
    <SearchResults<string>
      EmptySearchResultComponent={EmptyParticipantSearchList}
      LoadingIndicator={LoadingIndicator}
      searchQueryInProgress={searchQueryInProgress}
      searchResults={searchQuery ? searchResults : blockedUsers}
      SearchResultList={BlockedUserListing}
    />
  );
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="filter" ref={ref} />;
  },
);

const InviteLinkButton = forwardRef(
  (
    { className, ...props }: ComponentProps<'button'>,
    ref: ForwardedRef<HTMLButtonElement>,
  ) => (
    <button
      {...props}
      className={clsx('str-video__invite-link-button', className)}
      ref={ref}
    >
      <div className="str-video__invite-participant-icon" />
      <div className="str-video__invite-link-button__text">Invite Link</div>
    </button>
  ),
);
