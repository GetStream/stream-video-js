import React, { useCallback } from 'react';
import { useParticipants } from '@stream-io/video-react-bindings';
import { EmptyParticipantSearchList as DefaultEmptyParticipantList } from './EmptyParticipantSearchList';
import { GetInviteLinkButton as DefaultInviteLinkButton } from './GetInviteLinkButton';
import { LoadingIndicator } from '../LoadingIndicator';
import {
  CallParticipantListHeader,
  CallParticipantListHeaderProps,
} from './CallParticipantListHeader';
import {
  CallParticipantListing as DefaultParticipantListing,
  CallParticipantListingProps,
} from './CallParticipantListing';
import { SearchInput, SearchResults } from '../Search';
import { useSearch, UseSearchParams } from '../Search/hooks';

import type { StreamVideoParticipant } from '@stream-io/video-client';

type CallParticipantListProps = {
  /** Click event listener function to be invoked in order to dismiss / hide the CallParticipantsList from the UI */
  onClose: () => void;
  /** Custom component to replace a button for generating invitation link to the call */
  GetInviteLinkButton?: React.ComponentType;
  /** Custom function to override the logic for retrieving searched for participants */
  participantSearchFn?: UseSearchParams<StreamVideoParticipant>['searchFn'];
  /** Custom component to be rendered when search result is empty */
  EmptyParticipantSearchResultComponent?: React.ComponentType;
  /** Custom CallParticipantsList Header component */
  Header?: React.ComponentType<CallParticipantListHeaderProps>;
  /** Custom component to render the list of participants. Used render participant search results as well. */
  CallParticipantListing?: React.ComponentType<CallParticipantListingProps>;
};
export const CallParticipantsList = ({
  EmptyParticipantSearchResultComponent = DefaultEmptyParticipantList,
  Header = CallParticipantListHeader,
  GetInviteLinkButton = DefaultInviteLinkButton,
  onClose,
  CallParticipantListing = DefaultParticipantListing,
  participantSearchFn,
}: CallParticipantListProps) => {
  const participants = useParticipants();
  const searchFn = useCallback(
    (queryString: string) => {
      return Promise.resolve(
        participants.filter((participant) =>
          participant.user?.name.match(new RegExp(queryString)),
        ),
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
      </div>
      <div className="str-video__participant-list__footer">
        <GetInviteLinkButton />
      </div>
    </div>
  );
};
