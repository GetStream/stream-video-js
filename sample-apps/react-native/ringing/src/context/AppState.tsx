import { createContext, PropsWithChildren, useContext, useState } from 'react';

type AppState = {
  user_id?: string;
};

type AppStateContext = AppState & {
  setState: (state: AppState) => void;
};

const AppStateCtx = createContext<AppStateContext | undefined>(undefined);

export const AppStateProvider = (props: PropsWithChildren) => {
  const { children } = props;
  const [state, setState] = useState<AppState>();
  return (
    <AppStateCtx.Provider value={{ ...state, setState }}>
      {children}
    </AppStateCtx.Provider>
  );
};

export const useAppState = (): AppStateContext => {
  const context = useContext(AppStateCtx);
  if (!context) {
    throw new Error('useAppState must be used within a AppStateProvider');
  }
  return context;
};
