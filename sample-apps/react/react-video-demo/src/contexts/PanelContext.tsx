import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useEffect,
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

type PanelName =
  | 'chat'
  | 'participant-list'
  | 'device-settings'
  | 'reaction'
  | 'qrcode';

type Props = {
  toggleCollapse: (panel: PanelName) => void;
  toggleHide: (panel: PanelName) => void;
  chatPanelVisibility: PANEL_VISIBILITY;
  participantsPanelVisibility: PANEL_VISIBILITY;
  qrCodeVisibility: PANEL_VISIBILITY;
  isSettingsVisible: boolean;
  isReactionVisible: boolean;
};

const PanelContext = createContext<Props>({
  toggleCollapse: () => null,
  toggleHide: () => null,
  chatPanelVisibility: PANEL_VISIBILITY.hidden,
  participantsPanelVisibility: PANEL_VISIBILITY.hidden,
  qrCodeVisibility: PANEL_VISIBILITY.expanded,
  isSettingsVisible: false,
  isReactionVisible: false,
});

export const PanelProvider = ({ children }: { children: ReactNode }) => {
  const [chatVisibility, setChatVisibility] = useState<PANEL_VISIBILITY>(
    PANEL_VISIBILITY.hidden,
  );
  const [participantsPanelVisibility, setParticipantsPanelVisibility] =
    useState<PANEL_VISIBILITY>(PANEL_VISIBILITY.hidden);

  const [qrCodeVisibility, setQrCodeVisibility] = useState<PANEL_VISIBILITY>(
    PANEL_VISIBILITY.expanded,
  );

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

  useEffect(() => {
    if (
      chatVisibility !== PANEL_VISIBILITY.expanded &&
      participantsPanelVisibility !== PANEL_VISIBILITY.expanded
    ) {
      setQrCodeVisibility(PANEL_VISIBILITY.collapsed);
    } else {
      setQrCodeVisibility(PANEL_VISIBILITY.expanded);
    }
  }, [chatVisibility, participantsPanelVisibility]);

  return (
    <PanelContext.Provider
      value={{
        toggleCollapse,
        toggleHide,
        chatPanelVisibility: chatVisibility,
        participantsPanelVisibility: participantsPanelVisibility,
        qrCodeVisibility,
        isSettingsVisible,
        isReactionVisible,
      }}
    >
      {children}
    </PanelContext.Provider>
  );
};

export const usePanelContext = () => useContext(PanelContext);
