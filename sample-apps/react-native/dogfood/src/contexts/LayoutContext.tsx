import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
} from 'react';

export type Layout = 'grid' | 'spotlight';

interface LayoutContextState {
  selectedLayout: Layout;
  onLayoutSelection: (layout: Layout) => void;
}

const LayoutContext = createContext<LayoutContextState | null>(null);

interface LayoutProviderProps {
  children: ReactNode;
}

const LayoutProvider: React.FC<LayoutProviderProps> = ({ children }) => {
  const [selectedLayout, setSelectedLayout] = useState<Layout>('grid');

  const onLayoutSelection = useCallback((layout: Layout) => {
    setSelectedLayout(layout);
  }, []);

  return (
    <LayoutContext.Provider value={{ selectedLayout, onLayoutSelection }}>
      {children}
    </LayoutContext.Provider>
  );
};

const useLayout = (): LayoutContextState => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};

export { LayoutProvider, useLayout };
