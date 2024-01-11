import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { Placement, OffsetOptions } from '@floating-ui/react';
import { useBreakpoint } from '../hooks';
import { useIsDemoEnvironment } from './AppEnvironmentContext';
import { TourSDKOptions } from '../components/TourPanel/TourSDKOptions';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

const tourData: Step[] = [
  {
    header:
      'Stream’s Video & Audio SDK is designed to support Livestreaming & Audio Rooms.',
    placement: 'bottom-start',
    anchor:
      '.rd__documentation-button .str-video__composite-button__button-group',
    component: TourSDKOptions,
    offset: {
      mainAxis: 10,
      crossAxis: 0,
      alignmentAxis: -12,
    },
  },
  {
    header: 'Larger network, faster connections.',
    explanation:
      'SFU Cascading and EDGE Network ensures low latency and high video quality consistently.',
    placement: 'left-start',
    anchor: '.rd__header__latency',
    image: {
      src: `${basePath}/server-status.png`,
    },
    offset: {
      mainAxis: 10,
      crossAxis: -5,
      alignmentAxis: -15,
    },
  },
  {
    header: 'Seamless Chat Integration out-of-the-box',
    explanation:
      'Build real-time chat messaging in less time. Rapidly ship in-call messaging with our highly reliable chat infrastructure. Try sending the first message!',
    placement: 'left-start',
    anchor: '.str-video__chat',
    delay: 200,
    image: {
      src: `${basePath}/chat.png`,
    },
    offset: {
      mainAxis: 10,
      crossAxis: 0,
      alignmentAxis: -12,
    },
  },
  {
    header: 'Participant features, host controls and more.',
    explanation:
      'Test these features for yourself and add more users to the demo call.',
    placement: 'left-start',
    anchor: '.rd__participants',
    delay: 200,
    image: {
      src: `${basePath}/invite-participants.png`,
    },
    offset: {
      mainAxis: 10,
      crossAxis: 0,
      alignmentAxis: -12,
    },
  },
  {
    header: 'Check Call Quality & Statistics',
    explanation:
      'View monitored call metrics such as latency, jitter, and packet loss in real-time for in-depth performance insights.',
    placement: 'left-start',
    anchor: '.rd__sidebar__call-stats',
    delay: 200,
    image: {
      src: `${basePath}/stats.png`,
    },
    offset: {
      mainAxis: 10,
      crossAxis: 0,
      alignmentAxis: -12,
    },
  },
];

export enum StepNames {
  Start = 1,
  Network = 2,
  Chat = 3,
  Invite = 4,
  Stats = 5,
}

type Step = {
  header: string;
  explanation?: string;
  anchor: string;
  placement: Placement;
  delay?: number;
  image?: {
    src: string;
  };
  component?: any;
  offset: OffsetOptions;
};

type Props = {
  next: () => void;
  current: number;
  total: number;
  step: Step | undefined;
  active: boolean;
  toggleTour: () => void;
};

const TourContext = createContext<Props>({
  next: () => null,
  current: 0,
  total: 0,
  step: undefined,
  active: false,
  toggleTour: () => null,
});

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const isDemo = useIsDemoEnvironment();

  const steps = tourData;
  const [active, setActive] = useState<boolean>(isDemo);
  const [current, setCurrent]: any = useState<number>(0);

  const breakpoint = useBreakpoint();
  useEffect(() => {
    breakpoint === 'xs' || (breakpoint === 'sm' && setActive(false));
  }, [breakpoint]);

  const toggleTour = useCallback(() => {
    if (active) {
      setCurrent(-1);
    }

    if (!active) {
      setCurrent(0);
    }
    setActive(!active);
  }, [active]);

  const next = useCallback(() => {
    setCurrent(current + 1);
  }, [current, setCurrent]);

  return (
    <TourContext.Provider
      value={{
        total: steps.length,
        current: current + 1,
        next,
        step: steps[current],
        active,
        toggleTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => useContext(TourContext);
