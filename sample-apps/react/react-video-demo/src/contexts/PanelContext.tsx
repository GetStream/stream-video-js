import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
} from 'react';

import { useBreakpoint } from '../hooks/useBreakpoints';

export enum PANEL_VISIBILITY {
  hidden,
  collapsed,
  expanded,
}

const togglePanelVisibility = (prev: PANEL_VISIBILITY) =>
  prev === PANEL_VISIBILITY.hidden
    ? PANEL_VISIBILITY.expanded
    : PANEL_VISIBILITY.hidden;

const togglePanelCollapse = (prev: PANEL_VISIBILITY) =>
  prev === PANEL_VISIBILITY.collapsed
    ? PANEL_VISIBILITY.expanded
    : PANEL_VISIBILITY.collapsed;

type PanelName = 'chat' | 'participant-list' | 'device-settings' | 'reaction';

type Props = {
  toggleCollapse: (panel: PanelName) => void;
  toggleHide: (panel: PanelName) => void;
  chatPanelVisibility: PANEL_VISIBILITY;
  participantsPanelVisibility: PANEL_VISIBILITY;
  isSettingsVisible: boolean;
  isReactionVisible: boolean;
};

const PanelContext = createContext<Props>({
  toggleCollapse: () => null,
  toggleHide: () => null,
  chatPanelVisibility: PANEL_VISIBILITY.hidden,
  participantsPanelVisibility: PANEL_VISIBILITY.hidden,
  isSettingsVisible: false,
  isReactionVisible: false,
});

export const PanelProvider = ({ children }: { children: ReactNode }) => {
  const [chatVisibility, setChatVisibility] = useState<PANEL_VISIBILITY>(
    PANEL_VISIBILITY.hidden,
  );
  const [participantsPanelVisibility, setParticipantsPanelVisibility] =
    useState<PANEL_VISIBILITY>(PANEL_VISIBILITY.hidden);

  const [isSettingsVisible, setSettingsVisible] = useState<boolean>(false);

  const [isReactionVisible, setReactionVisible] = useState<boolean>(false);

  const breakpoint = useBreakpoint();

  const toggleCollapse = (panel: PanelName) => {
    if (panel === 'chat') setChatVisibility(togglePanelCollapse);
    if (panel === 'participant-list')
      setParticipantsPanelVisibility(togglePanelCollapse);
  };

  const toggleHide = useCallback(
    (panel: PanelName) => {
      if (panel === 'chat') {
        setChatVisibility(togglePanelVisibility);
        if (breakpoint === 'xs' || breakpoint === 'sm') {
          setParticipantsPanelVisibility(PANEL_VISIBILITY.hidden);
        }
      }
      if (panel === 'participant-list') {
        setParticipantsPanelVisibility(togglePanelVisibility);
        if (breakpoint === 'xs' || breakpoint === 'sm') {
          setChatVisibility(PANEL_VISIBILITY.hidden);
        }
      }

      if (panel === 'device-settings') setSettingsVisible((prev) => !prev);
      if (panel === 'reaction') setReactionVisible((prev) => !prev);
    },
    [breakpoint],
  );

  return (
    <PanelContext.Provider
      value={{
        toggleCollapse,
        toggleHide,
        chatPanelVisibility: chatVisibility,
        participantsPanelVisibility: participantsPanelVisibility,
        isSettingsVisible,
        isReactionVisible,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
};

export const usePanelContext = () => useContext(PanelContext);
