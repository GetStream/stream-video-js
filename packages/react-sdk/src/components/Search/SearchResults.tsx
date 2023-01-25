import * as React from 'react';
import { LoadingIndicator as DefaultLoadingIndicator } from '../LoadingIndicator';

export type SearchResultListProps<T> = {
  data: T[];
};

export type SearchResultsProps<T> = {
  EmptySearchResultComponent: React.ComponentType;
  searchQueryInProgress: boolean;
  searchResults: T[];
  SearchResultList: React.ComponentType<SearchResultListProps<T>>;
  LoadingIndicator?: React.ComponentType;
};

export const SearchResults = <T extends unknown>({
  EmptySearchResultComponent,
  LoadingIndicator = DefaultLoadingIndicator,
  searchQueryInProgress,
  searchResults,
  SearchResultList,
}: SearchResultsProps<T>) => {
  if (searchQueryInProgress) {
    return (
      <div className="str-video__search-results--loading">
        <LoadingIndicator />
      </div>
    );
  }
  if (!searchResults.length) {
    return <EmptySearchResultComponent />;
  }

  return <SearchResultList data={searchResults} />;
};
