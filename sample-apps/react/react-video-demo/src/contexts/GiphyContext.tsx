import React, { useContext, useState, ReactNode } from 'react';

const GiphyContext = React.createContext(
  {} as {
    giphyState: boolean;
    setGiphyState: React.Dispatch<React.SetStateAction<boolean>>;
  },
);

export const GiphyContextProvider = ({ children }: { children: ReactNode }) => {
  const [giphyState, setGiphyState] = useState(false);

  const value = { giphyState, setGiphyState };
  return (
    <GiphyContext.Provider value={value}>{children}</GiphyContext.Provider>
  );
};

export const useGiphyContext = () => useContext(GiphyContext);
