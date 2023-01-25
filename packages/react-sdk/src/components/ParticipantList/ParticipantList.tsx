import React, { useCallback } from 'react';
import { useParticipants } from '@stream-io/video-react-bindings';
import { EmptyParticipantSearchList as DefaultEmptyParticipantList } from './EmptyParticipantSearchList';
import { GetInviteLinkButton as DefaultInviteLinkButton } from './GetInviteLinkButton';
import { LoadingIndicator } from '../LoadingIndicator';
import {
  ParticipantListHeader,
  ParticipantListHeaderProps,
} from './ParticipantListHeader';
import {
  ParticipantListing as DefaultParticipantListing,
  ParticipantListingProps,
} from './ParticipantListing';
import { SearchInput, SearchResults } from '../Search';
import { useSearch, UseSearchParams } from '../Search/hooks';

import type { StreamVideoParticipant } from '@stream-io/video-client';

type ParticipantListProps = {
  onClose: () => void;
  GetInviteLinkButton?: React.ComponentType;
  participantSearchFn?: UseSearchParams<StreamVideoParticipant>['searchFn'];
  EmptyParticipantSearchResultComponent?: React.ComponentType;
  Header?: React.ComponentType<ParticipantListHeaderProps>;
  ParticipantListing?: React.ComponentType<ParticipantListingProps>;
};
export const ParticipantList = ({
  EmptyParticipantSearchResultComponent = DefaultEmptyParticipantList,
  Header = ParticipantListHeader,
  GetInviteLinkButton = DefaultInviteLinkButton,
  onClose,
  ParticipantListing = DefaultParticipantListing,
  participantSearchFn,
}: ParticipantListProps) => {
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
          SearchResultList={ParticipantListing}
        />
      </div>
      <div className="str-video__participant-list__footer">
        <GetInviteLinkButton />
      </div>
    </div>
  );
};
