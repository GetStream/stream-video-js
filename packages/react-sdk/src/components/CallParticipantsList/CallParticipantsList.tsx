import {
  ComponentPropsWithRef,
  ComponentType,
  ForwardedRef,
  useCallback,
} from 'react';
import { useParticipants } from '@stream-io/video-react-bindings';
import type { StreamVideoParticipant } from '@stream-io/video-client';
import { BlockedUserListing } from './BlockedUserListing';
import { CopyToClipboardButtonWithPopup } from '../Button';
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
  participantSearchFn?: UseSearchParams<StreamVideoParticipant>['searchFn'];
  /** Interval in ms, during which the participant search calls will be throttled. The default value is 200ms. */
  throttleSearchInterval?: number;
};
export const CallParticipantsList = ({
  CallParticipantListing = DefaultParticipantListing,
  EmptyParticipantSearchResultComponent = DefaultEmptyParticipantList,
  InviteLinkButton,
  Header = CallParticipantListHeader,
  onClose,
  participantSearchFn,
  throttleSearchInterval = 200,
}: CallParticipantListProps) => {
  const participants = useParticipants();
  const searchFn = useCallback(
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

  const {
    exitSearch,
    handleInputChange,
    searchQueryInProgress,
    searchQuery,
    searchResults,
  } = useSearch<StreamVideoParticipant>({
    searchFn: participantSearchFn || searchFn,
    throttleInterval: throttleSearchInterval,
  });

  return (
    <div className="str-video__participant-list">
      <Header onClose={onClose} participants={participants} />
      <SearchInput
        value={searchQuery}
        onChange={handleInputChange}
        exitSearch={exitSearch}
        isActive={!!searchQuery}
      />
      <div className="str-video__participant-list__content">
        <SearchResults<StreamVideoParticipant>
          EmptySearchResultComponent={EmptyParticipantSearchResultComponent}
          LoadingIndicator={LoadingIndicator}
          searchQueryInProgress={searchQueryInProgress}
          searchResults={searchQuery ? searchResults : participants}
          SearchResultList={CallParticipantListing}
        />
        {/* TODO: implement search once once tabs design is out */}
        <BlockedUserListing />
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
