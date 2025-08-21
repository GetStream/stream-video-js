import { useEffect, useRef, useState } from 'react';

export type SearchController<T> = {
  /** Flag signals that the search request is flight await the response */
  searchQueryInProgress: boolean;
  /** Array of items returned by the search query */
  searchResults: T[];
};

export type UseSearchParams<T> = {
  /** Search function performing the search request */
  searchFn: (searchQuery: string) => Promise<T[]>;
  /** Debounce interval applied to the search function */
  debounceInterval?: number;
  /** Search query string */
  searchQuery?: string;
};

export const useSearch = <T>({
  debounceInterval = 200,
  searchFn,
  searchQuery = '',
}: UseSearchParams<T>): SearchController<T> => {
  const [searchResults, setSearchResults] = useState<T[]>([]);
  const [searchQueryInProgress, setSearchQueryInProgress] = useState(false);

  const searchFnRef = useRef(searchFn);
  searchFnRef.current = searchFn;

  useEffect(() => {
    if (!searchQuery.length) {
      setSearchQueryInProgress(false);
      setSearchResults([]);
      return;
    }

    setSearchQueryInProgress(true);

    const timeout = setTimeout(async () => {
      try {
        const results = await searchFnRef.current(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error(error);
      } finally {
        setSearchQueryInProgress(false);
      }
    }, debounceInterval);

    return () => {
      clearTimeout(timeout);
    };
  }, [debounceInterval, searchQuery]);

  return {
    searchQueryInProgress,
    searchResults,
  };
};
