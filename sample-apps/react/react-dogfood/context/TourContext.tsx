import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { OffsetOptions, Placement } from '@floating-ui/react';
import { useBreakpoint } from '../hooks';
import { useIsDemoEnvironment } from './AppEnvironmentContext';
import { TourSDKOptions } from '../components/TourPanel/TourSDKOptions';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Defines the list of steps.
 * Please keep this list sorted.
 */
export enum StepNames {
  Start = 1,
  Invite = 2,
  Chat = 3,
  Stats = 4,
  Network = 5,
}

const tourData: Step[] = Array.from({
  length: Math.floor(Object.keys(StepNames).length / 2),
});
tourData[StepNames.Start] = {
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
};
tourData[StepNames.Network] = {
  header: 'Edge Network',
  explanation:
    'Our global edge network ensures an optimal call latency. This improves call quality, user experience and reliability.',
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
};
tourData[StepNames.Chat] = {
  header: 'Send a message 🚀',
  explanation: `Now use Stream's in-call chat messaging to write and send a message to the group, and react to their messages.`,
  placement: 'left-end',
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
};
tourData[StepNames.Invite] = {
  header: 'Invite friends, access host controls and more',
  explanation:
    'Copy, paste, and send the unique URL to this private call to a friend or scan the QR code with your phone to test it yourself.',
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
};
tourData[StepNames.Stats] = {
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
};

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
  closeTour: () => void;
};

const TourContext = createContext<Props>({
  next: () => {},
  current: 0,
  total: 0,
  step: undefined,
  active: false,
  closeTour: () => {},
});

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const isDemo = useIsDemoEnvironment();

  const steps = tourData;
  const [active, setActive] = useState(isDemo);
  const [current, setCurrent] = useState(0);

  const breakpoint = useBreakpoint();
  useEffect(() => {
    breakpoint === 'xs' || (breakpoint === 'sm' && setActive(false));
  }, [breakpoint]);

  const closeTour = useCallback(() => {
    setCurrent(-1);
    setActive(false);
  }, []);

  const next = useCallback(() => {
    setCurrent(current + 1);
  }, [current, setCurrent]);

  return (
    <TourContext.Provider
      value={{
        total: steps.length - 1,
        current: current + 1,
        next,
        step: steps[current + 1],
        active,
        closeTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => useContext(TourContext);
