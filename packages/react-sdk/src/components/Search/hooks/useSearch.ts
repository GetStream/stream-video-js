import throttle from 'lodash.throttle';
import {
  ChangeEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

export type SearchController<T> = {
  /** Clears / resets the search input value */
  clearInput: () => void;
  /** Resets the search state to inactive */
  exitSearch: () => void;
  /** Search input's change event handler */
  handleInputChange: ChangeEventHandler;
  /** Flag signals that the search request is flight await the response */
  searchQueryInProgress: boolean;
  /** Search input value */
  searchQuery: string;
  /** Array of items returned by the search query */
  searchResults: T[];
};

export type UseSearchParams<T> = {
  /** Search function performing the search request */
  searchFn: (searchQuery: string) => Promise<T[]>;
  /** Debounce interval applied to the search function */
  throttleInterval: number;
};

export const useSearch = <T>({
  throttleInterval,
  searchFn,
}: UseSearchParams<T>): SearchController<T> => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [searchQueryInProgress, setSearchQueryInProgress] = useState(false);
  const queryAborted = useRef(false);

  const doSearch = useMemo(
    () => throttle(searchFn, throttleInterval),
    [throttleInterval, searchFn],
  );

  const handleInputChange: ChangeEventHandler<HTMLInputElement> = useCallback(
    async (event) => {
      const query = event.target.value;
      setSearchQuery(query);
      if (query) {
        setSearchQueryInProgress(true);
        const results = await doSearch(query);
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
