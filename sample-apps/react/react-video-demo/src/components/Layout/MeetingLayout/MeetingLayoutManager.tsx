import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  PaginatedGridLayout,
  SpeakerLayout,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { useBreakpoint } from '../../../hooks/useBreakpoints';
import { Overlay, VideoPlaceholder } from '../../Participant/Participant';
import MeetingParticipants from '../../MeetingParticipants';
import ScreenShareParticipants from '../../ScreenShareParticipants';

type LayoutId =
  | 'dynamic'
  | 'dynamic_screenshare'
  | 'speaker'
  | 'speaker_right'
  | 'speaker_top'
  | 'grid';

export type LayoutType = {
  id: LayoutId;
  displayName: string;
  getElement: () => JSX.Element;
  hidden?: boolean;
};

const LayoutRegistry: Record<LayoutId, LayoutType> = {
  dynamic: {
    id: 'dynamic',
    displayName: 'Dynamic',
    getElement: () => <MeetingParticipants />,
  },
  dynamic_screenshare: {
    id: 'dynamic_screenshare',
    displayName: 'Dynamic (Screen Share)',
    getElement: () => <ScreenShareParticipants />,
    hidden: true,
  },
  speaker: {
    id: 'speaker',
    displayName: 'Speaker View',
    getElement: () => (
      <SpeakerLayout
        ParticipantViewUISpotlight={Overlay}
        ParticipantViewUIBar={Overlay}
        VideoPlaceholder={VideoPlaceholder}
      />
    ),
  },
  speaker_right: {
    id: 'speaker_right',
    displayName: 'Speaker View (right)',
    getElement: () => (
      <SpeakerLayout
        participantsBarPosition="right"
        ParticipantViewUISpotlight={Overlay}
        ParticipantViewUIBar={Overlay}
        VideoPlaceholder={VideoPlaceholder}
      />
    ),
  },
  speaker_top: {
    id: 'speaker_top',
    displayName: 'Speaker View (top)',
    getElement: () => (
      <SpeakerLayout
        participantsBarPosition="top"
        ParticipantViewUISpotlight={Overlay}
        ParticipantViewUIBar={Overlay}
        VideoPlaceholder={VideoPlaceholder}
      />
    ),
  },
  grid: {
    id: 'grid',
    displayName: 'Grid',
    getElement: () => (
      <PaginatedGridLayout
        groupSize={12}
        VideoPlaceholder={VideoPlaceholder}
        ParticipantViewUI={Overlay}
      />
    ),
  },
};

const layouts = Object.values<LayoutType>(LayoutRegistry).filter(
  (layout) => !layout.hidden,
);

export type LayoutManagerAPI = {
  isSwitchingAllowed: boolean;
  layouts: LayoutType[];
  currentLayout: LayoutType;
  switchLayout: (layoutId: keyof typeof LayoutRegistry) => void;
};

const LayoutManagerContext = createContext<LayoutManagerAPI | undefined>(
  undefined,
);
LayoutManagerContext.displayName = 'LayoutManagerContext';

const LAST_USED_LAYOUT = '@react-video-demo/layout';
const getLayoutPreference = () => {
  try {
    const savedLayout = window.localStorage.getItem(
      LAST_USED_LAYOUT,
    ) as LayoutId | null;
    return (
      (savedLayout && LayoutRegistry[savedLayout]) ?? LayoutRegistry.dynamic
    );
  } catch (e) {
    return LayoutRegistry.dynamic;
  }
};

const setLayoutPreference = (layoutId: LayoutId) => {
  try {
    window.localStorage.setItem(LAST_USED_LAYOUT, layoutId);
  } catch (e) {
    // ignore
  }
};

export const LayoutManagerProvider = ({ children }: PropsWithChildren) => {
  const [currentLayout, setCurrentLayout] = useState(() =>
    getLayoutPreference(),
  );
  const switchLayout = useCallback((layoutId: LayoutId) => {
    setCurrentLayout(LayoutRegistry[layoutId]);
    setLayoutPreference(layoutId);
  }, []);

  const { useHasOngoingScreenShare } = useCallStateHooks();
  const hasScreenShare = useHasOngoingScreenShare();
  const [lastLayout, setLastLayout] = useState(currentLayout);
  const breakpoint = useBreakpoint();
  useEffect(() => {
    if (breakpoint === 'xs' || breakpoint === 'sm') {
      setLastLayout(currentLayout);
      const layoutToSet = hasScreenShare
        ? LayoutRegistry.dynamic_screenshare
        : LayoutRegistry.dynamic;
      setCurrentLayout(layoutToSet);
    } else {
      setCurrentLayout(lastLayout);
    }
  }, [breakpoint, currentLayout, hasScreenShare, lastLayout]);

  return (
    <LayoutManagerContext.Provider
      value={{
        isSwitchingAllowed: !hasScreenShare,
        layouts,
        currentLayout,
        switchLayout,
      }}
    >
      {children}
    </LayoutManagerContext.Provider>
  );
};

export const useLayoutManager = () => {
  const ctx = useContext(LayoutManagerContext);
  if (ctx) return ctx;
  throw new Error('useLayoutManager must be used within LayoutManagerContext');
};
