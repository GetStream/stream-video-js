import { createContext, PropsWithChildren, useContext } from 'react';

export type AppEnvironment = 'pronto' | 'demo' | string;

const environmentOverride =
  typeof window !== 'undefined' &&
  new URLSearchParams(window.location.search).get('environment');

const environment: AppEnvironment =
  environmentOverride || process.env.NEXT_PUBLIC_APP_ENVIRONMENT || 'demo';

const AppEnvironmentContext = createContext(environment);

export const AppEnvironmentProvider = ({ children }: PropsWithChildren) => {
  return (
    <AppEnvironmentContext.Provider value={environment}>
      {children}
    </AppEnvironmentContext.Provider>
  );
};

/**
 * Returns the current app environment.
 */
export const useAppEnvironment = (): AppEnvironment => {
  const appEnvironment = useContext(AppEnvironmentContext);
  if (!appEnvironment) {
    throw new Error(
      'useAppEnvironment must be used within an AppEnvironmentContext',
    );
  }
  return appEnvironment;
};

/**
 * Returns true if the current app environment is 'pronto'.
 */
export const useIsProntoEnvironment = () => useAppEnvironment() === 'pronto';

/**
 * Returns true if the current app environment is 'demo'.
 */
export const useIsDemoEnvironment = () => useAppEnvironment() === 'demo';
