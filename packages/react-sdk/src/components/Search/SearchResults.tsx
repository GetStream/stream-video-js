import { ComponentType } from 'react';
import { LoadingIndicator as DefaultLoadingIndicator } from '../LoadingIndicator';
import { SearchController } from './hooks';

export type SearchResultListProps<T> = {
  data: T[];
};

export type SearchResultsProps<T> = Pick<
  SearchController<T>,
  'searchResults' | 'searchQueryInProgress'
> & {
  /** Component to be displayed, when empty array of search results is provided */
  EmptySearchResultComponent: ComponentType;
  /** Component will be used to render non-empty array of search results  */
  SearchResultList: ComponentType<SearchResultListProps<T>>;
  /** Component to be displayed while the search query request is in progress */
  LoadingIndicator?: ComponentType;
};

export function SearchResults<T>({
  EmptySearchResultComponent,
  LoadingIndicator = DefaultLoadingIndicator,
  searchQueryInProgress,
  searchResults,
  SearchResultList,
}: SearchResultsProps<T>) {
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
}
