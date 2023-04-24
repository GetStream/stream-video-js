import {
  ComponentPropsWithRef,
  ComponentType,
  ForwardedRef,
  forwardRef,
  useCallback,
  useState,
} from 'react';
import {
  useCall,
  useCallMetadata,
  useOwnCapabilities,
  useParticipants,
} from '@stream-io/video-react-bindings';
import {
  name,
  OwnCapability,
  StreamVideoParticipant,
} from '@stream-io/video-client';
import { BlockedUserListing } from './BlockedUserListing';
import {
  CopyToClipboardButtonWithPopup,
  IconButton,
  TextButton,
} from '../Button';
import {
  CallParticipantListHeader,
  CallParticipantListHeaderProps,
} from './CallParticipantListHeader';
import {
  CallParticipantListing as DefaultParticipantListing,
  CallParticipantListingProps,
} from './CallParticipantListing';
import { EmptyParticipantSearchList as DefaultEmptyParticipantList } from './EmptyParticipantSearchList';
import { LoadingIndicator } from '../LoadingIndicator';
import { SearchInput, SearchResults } from '../Search';
import { useSearch, UseSearchParams } from '../Search/hooks';
import { Restricted } from '../Moderation';
import {
  GenericMenu,
  GenericMenuButtonItem,
  MenuToggle,
  ToggleMenuButtonProps,
} from '../Menu';

type CallParticipantListProps = {
  /** Click event listener function to be invoked in order to dismiss / hide the CallParticipantsList from the UI */
  onClose: () => void;
  /** Custom component to render the list of participants. Used render participant search results as well. */
  CallParticipantListing?: ComponentType<CallParticipantListingProps>;
  /** Custom component to be rendered when search result is empty */
  EmptyParticipantSearchResultComponent?: ComponentType;
  /** Custom CallParticipantsList Header component */
  Header?: ComponentType<CallParticipantListHeaderProps>;
  /** Custom component to replace a button for generating invitation link to the call */
  InviteLinkButton?: ComponentType<
    ComponentPropsWithRef<'button'> & { ref: ForwardedRef<HTMLButtonElement> }
  >;
  /** Custom function to override the logic for retrieving searched for participants */
  activeUsersSearchFn?: UseSearchParams<StreamVideoParticipant>['searchFn'];
  blockedUsersSearchFn?: UseSearchParams<string>['searchFn'];
  /** Interval in ms, during which the participant search calls will be throttled. The default value is 200ms. */
  debounceSearchInterval?: number;
};

const UserListTypes = {
  active: 'Active users',
  blocked: 'Blocked users',
} as const;

export const CallParticipantsList = ({
  CallParticipantListing,
  EmptyParticipantSearchResultComponent,
  InviteLinkButton,
  Header = CallParticipantListHeader,
  onClose,
  activeUsersSearchFn,
  blockedUsersSearchFn,
  debounceSearchInterval,
}: CallParticipantListProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [userListType, setUserListType] =
    useState<keyof typeof UserListTypes>('active');

  const participants = useParticipants();

  const exitSearch = useCallback(() => setSearchQuery(''), []);

  return (
    <div className="str-video__participant-list">
      <Header onClose={onClose} participants={participants} />
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
            CallParticipantListing={CallParticipantListing}
            EmptyParticipantSearchResultComponent={
              EmptyParticipantSearchResultComponent
            }
            debounceSearchInterval={debounceSearchInterval}
          />
        )}
        {userListType === 'blocked' && (
          <BlockedUsersSearchResults
            searchQuery={searchQuery}
            EmptyParticipantSearchResultComponent={
              EmptyParticipantSearchResultComponent
            }
            blockedUsersSearchFn={blockedUsersSearchFn}
            debounceSearchInterval={debounceSearchInterval}
          />
        )}
      </div>
      <div className="str-video__participant-list__footer">
        {InviteLinkButton && (
          <CopyToClipboardButtonWithPopup
            Button={InviteLinkButton}
            copyValue={
              typeof window !== 'undefined' ? window.location.href : ''
            }
          />
        )}
      </div>
    </div>
  );
};

const CallParticipantListContentHeader = ({
  userListType,
  setUserListType,
}: {
  userListType: keyof typeof UserListTypes;
  setUserListType: React.Dispatch<
    React.SetStateAction<keyof typeof UserListTypes>
  >;
}) => {
  const ownCapabilities = useOwnCapabilities();
  const call = useCall();

  const muteAll = () => {
    call?.muteAllUsers('audio');
  };

  return (
    <div className="str-video__participant-list__content-header">
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
      <div className="str-video__participant-list__content-header-title">
        <span>{UserListTypes[userListType]}</span>
        {userListType === 'active' && (
          <Restricted
            availableGrants={ownCapabilities} // TODO: remove this line once Oliver's PR lands
            requiredGrants={[OwnCapability.MUTE_USERS]}
          >
            <TextButton onClick={muteAll}>Mute all</TextButton>
          </Restricted>
        )}
      </div>
    </div>
  );
};

const ActiveUsersSearchResults = ({
  CallParticipantListing = DefaultParticipantListing,
  EmptyParticipantSearchResultComponent = DefaultEmptyParticipantList,
  searchQuery,
  activeUsersSearchFn: activeUsersSearchFnFromProps,
  debounceSearchInterval = 200,
}: Pick<
  CallParticipantListProps,
  | 'EmptyParticipantSearchResultComponent'
  | 'CallParticipantListing'
  | 'activeUsersSearchFn'
  | 'debounceSearchInterval'
> & { searchQuery: string }) => {
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
      EmptySearchResultComponent={EmptyParticipantSearchResultComponent}
      LoadingIndicator={LoadingIndicator}
      searchQueryInProgress={searchQueryInProgress}
      searchResults={searchQuery ? searchResults : participants}
      SearchResultList={CallParticipantListing}
    />
  );
};

const BlockedUsersSearchResults = ({
  EmptyParticipantSearchResultComponent = DefaultEmptyParticipantList,
  blockedUsersSearchFn: blockedUsersSearchFnFromProps,
  debounceSearchInterval = 200,
  searchQuery,
}: Pick<
  CallParticipantListProps,
  | 'EmptyParticipantSearchResultComponent'
  | 'blockedUsersSearchFn'
  | 'debounceSearchInterval'
> & { searchQuery: string }) => {
  const { blocked_user_ids: blockedUsers = [] } = useCallMetadata()!;

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
      EmptySearchResultComponent={EmptyParticipantSearchResultComponent}
      LoadingIndicator={LoadingIndicator}
      searchQueryInProgress={searchQueryInProgress}
      searchResults={searchQuery ? searchResults : blockedUsers}
      SearchResultList={BlockedUserListing}
    />
  );
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleMenuButtonProps>(
  (props, ref) => {
    return <IconButton enabled={props.menuShown} icon="caret-down" ref={ref} />;
  },
);
