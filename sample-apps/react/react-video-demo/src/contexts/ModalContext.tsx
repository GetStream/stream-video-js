import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from 'react';

type Props = {
  close: () => void;
  component: ReactNode | undefined;
  setComponent: (component: ReactNode) => void;
  isVisible: boolean;
};

const ModalContext = createContext<Props>({
  close: () => null,
  component: undefined,
  setComponent: () => null,
  isVisible: false,
});

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [component, updateComponent]: any = useState(undefined);
  const [isVisible, setVisible]: any = useState<boolean>(false);

  const setComponent = useCallback((c: ReactNode) => {
    updateComponent(c);
    setVisible(true);
  }, []);

  const close = useCallback(() => {
    if (component) {
      setVisible(false);
      updateComponent(undefined);
    }
  }, [component]);

  return (
    <ModalContext.Provider
      value={{
        setComponent,
        component,
        close,
        isVisible,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModalContext = () => useContext(ModalContext);
