import {
  createContext,
  lazy,
  PropsWithChildren,
  ReactNode,
  Suspense,
  useContext,
} from 'react';
import type {
  BackgroundFiltersProps,
  BackgroundFiltersContextValue,
} from './types';

const BackgroundFiltersProviderImpl = lazy(() =>
  import('./BackgroundFilters').then((m) => ({
    default: m.BackgroundFiltersProvider,
  })),
);

/**
 * The context for the background filters.
 */
const BackgroundFiltersContext = createContext<
  BackgroundFiltersContextValue | undefined
>(undefined);

/**
 * A hook to access the background filters context API.
 */
export const useBackgroundFilters = () => {
  const context = useContext(BackgroundFiltersContext);
  if (!context) {
    throw new Error(
      'useBackgroundFilters must be used within a BackgroundFiltersProvider',
    );
  }
  return context;
};

/**
 * A provider component that enables the use of background filters in your app.
 *
 * Please make sure you have the `@stream-io/video-filters-web` package installed
 * in your project before using this component.
 */
export const BackgroundFiltersProvider = (
  props: PropsWithChildren<BackgroundFiltersProps> & {
    SuspenseFallback?: ReactNode;
  },
) => {
  const { SuspenseFallback = null, ...filterProps } = props;
  return (
    <Suspense fallback={SuspenseFallback}>
      <BackgroundFiltersProviderImpl
        {...filterProps}
        ContextProvider={BackgroundFiltersContext}
      />
    </Suspense>
  );
};
