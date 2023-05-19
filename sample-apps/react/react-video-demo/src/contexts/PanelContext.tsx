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
  toggleSettings: () => void;
  toggleReaction: () => void;
  isChatVisible: boolean;
  isParticipantsVisible: boolean;
  isSettingsVisible: boolean;
  isReactionVisible: boolean;
};

const PanelContext = createContext<Props>({
  toggleChat: () => null,
  toggleParticipants: () => null,
  toggleSettings: () => null,
  toggleReaction: () => null,
  isChatVisible: false,
  isParticipantsVisible: false,
  isSettingsVisible: false,
  isReactionVisible: false,
});

export const PanelProvider = ({ children }: { children: ReactNode }) => {
  const [isChatVisible, setChatVisible] = useState<boolean>(false);
  const [isParticipantsVisible, setParticipantsVisible] =
    useState<boolean>(false);

  const [isSettingsVisible, setSettingsVisible] = useState<boolean>(false);

  const [isReactionVisible, setReactionVisible] = useState<boolean>(false);

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

  const toggleSettings = useCallback(() => {
    setSettingsVisible(!isSettingsVisible);
  }, [isSettingsVisible]);

  const toggleReaction = useCallback(() => {
    setReactionVisible(!isReactionVisible);
  }, [isReactionVisible]);

  return (
    <PanelContext.Provider
      value={{
        toggleChat,
        toggleParticipants,
        toggleSettings,
        toggleReaction,
        isChatVisible,
        isParticipantsVisible,
        isSettingsVisible,
        isReactionVisible,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
};

export const usePanelContext = () => useContext(PanelContext);
