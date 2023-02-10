import { createContext, ReactNode, useContext, useState } from 'react';

type LoadingContextValue = {
  loading: boolean;
  setLoading: (loading: boolean) => void;
};

const LoadingStateContext = createContext<LoadingContextValue>({
  loading: false,
  setLoading: () => null,
});

export const LoadingStateProvider = ({ children }: { children: ReactNode }) => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingStateContext.Provider value={{ loading, setLoading }}>
      {children}
    </LoadingStateContext.Provider>
  );
};

export const useLoadingState = () => useContext(LoadingStateContext);
