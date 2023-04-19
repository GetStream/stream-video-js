import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from 'react';

import { useBreakpoint } from '../hooks/useBreakpoints';

type Props = {
  toggleChat: () => void;
  toggleParticipants: () => void;
  isChatVisible: boolean;
  isParticipantsVisible: boolean;
};

const PanelContext = createContext<Props>({
  toggleChat: () => null,
  toggleParticipants: () => null,
  isChatVisible: false,
  isParticipantsVisible: false,
});

export const PanelProvider = ({ children }: { children: ReactNode }) => {
  const [isChatVisible, setChatVisible]: any = useState<boolean>(false);
  const [isParticipantsVisible, setParticipantsVisible]: any =
    useState<boolean>(false);

  const breakpoint = useBreakpoint();

  const toggleChat = useCallback(() => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      setChatVisible(!isChatVisible);
      setParticipantsVisible(false);
    } else {
      setChatVisible(!isChatVisible);
    }
  }, [isChatVisible, isParticipantsVisible, breakpoint]);

  const toggleParticipants = useCallback(() => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      setParticipantsVisible(!isParticipantsVisible);
      setChatVisible(false);
    } else {
      setParticipantsVisible(!isParticipantsVisible);
    }
  }, [isParticipantsVisible, isChatVisible, breakpoint]);

  return (
    <PanelContext.Provider
      value={{
        toggleChat,
        toggleParticipants,
        isChatVisible,
        isParticipantsVisible,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
};

export const usePanelContext = () => useContext(PanelContext);
