import throttle from 'lodash.throttle';
import { ChangeEventHandler, useCallback, useRef, useState } from 'react';

export type SearchController<T> = {
  clearInput: () => void;
  exitSearch: () => void;
  handleInputChange: ChangeEventHandler;
  searchQueryInProgress: boolean;
  searchQuery: string;
  searchResults: T[];
};

export type UseSearchParams<T> = {
  /** Search function performing the search request */
  searchFn: (searchQuery: string) => Promise<T[]>;
  /** Debounce interval applied to the search function */
  debounceInterval?: number;
};

export const useSearch = <T extends unknown>({
  debounceInterval,
  searchFn,
}: UseSearchParams<T>): SearchController<T> => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [searchQueryInProgress, setSearchQueryInProgress] = useState(false);
  const queryAborted = useRef(false);

  const doSearch = useCallback(throttle(searchFn, debounceInterval || 200), [
    debounceInterval,
    searchFn,
  ]);

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      const searchQuery = event.target.value;
      setSearchQuery(searchQuery);
      if (searchQuery) {
        setSearchQueryInProgress(true);
        const results = await doSearch(searchQuery);
        if (queryAborted.current) {
          queryAborted.current = false;
        } else {
          setSearchResults(results || []);
        }
        setSearchQueryInProgress(false);
      } else {
        setSearchResults([]);
      }
    },
    [doSearch, queryAborted],
  );

  const abortQuery = useCallback(() => {
    queryAborted.current = true;
  }, [queryAborted]);

  const clearInput = useCallback(() => {
    setSearchQuery('');
  }, []);

  const exitSearch = useCallback(() => {
    abortQuery();
    clearInput();
    setSearchResults([]);
    setSearchQueryInProgress(false);
  }, [abortQuery, clearInput]);

  return {
    clearInput,
    exitSearch,
    handleInputChange,
    searchQueryInProgress,
    searchQuery,
    searchResults,
  };
};
