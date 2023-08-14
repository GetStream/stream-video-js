import {
  createContext,
  ReactElement,
  ReactNode,
  useContext,
  useState,
} from 'react';

type Props = {
  closeModal: () => void;
  modalElement: ReactElement | undefined;
  setModal: (element: ReactElement) => void;
  showModal: boolean;
};

const ModalContext = createContext<Props>({
  closeModal: () => null,
  modalElement: undefined,
  setModal: () => null,
  showModal: false,
});

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalElement, setModal] = useState<ReactElement | undefined>();

  return (
    <ModalContext.Provider
      value={{
        setModal,
        modalElement,
        closeModal: () => setModal(undefined),
        showModal: !!modalElement,
      }}
    >
      {children}
    </ModalContext.Provider>
  );
};

export const useModalContext = () => useContext(ModalContext);
