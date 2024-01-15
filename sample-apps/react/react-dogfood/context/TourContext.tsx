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
  Network = 2,
  Chat = 3,
}

const tourData: Step[] = Array.from({
  length: Math.floor(Object.keys(StepNames).length / 2),
});
tourData[StepNames.Start] = {
  header: 'Modern SDKs',
  placement: 'bottom-start',
  anchor:
    '.rd__documentation-button .str-video__composite-button__button-group',
  component: TourSDKOptions,
  explanation: `
    Modern SDKs to build video calling, audio rooms and livestreaming in days.
    This video calling experience is just one example of what you can build with Stream’s SDKs.`,
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
  header: 'Chat',
  explanation: `A full chat SDK/API with reactions, typing, unread counts, quoted replies, URL previews, image uploads, and basically anything you’d expect from a WhatsApp or Slack style app.`,
  placement: 'left-end',
  anchor: '.str-video__chat',
  delay: 100,
  image: {
    src: `${basePath}/chat.png`,
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

type TourContextValue = {
  next: () => void;
  current: number;
  total: number;
  step: Step | undefined;
  active: boolean;
  closeTour: () => void;
  setShowTourNextTime: (show: boolean) => void;
};

const TourContext = createContext<TourContextValue>({
  next: () => {},
  current: 0,
  total: 0,
  step: undefined,
  active: false,
  closeTour: () => {},
  setShowTourNextTime: () => {},
});

const ENABLE_TOUR_KEY = '@pronto/tour-enabled';
const isTourEnabled = () => {
  try {
    return localStorage.getItem(ENABLE_TOUR_KEY) !== 'false';
  } catch {
    return true;
  }
};

const setTourEnabled = (show: boolean) => {
  try {
    localStorage.setItem(ENABLE_TOUR_KEY, String(show));
  } catch (e) {
    console.warn('Could not set tour enabled state', e);
  }
};

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const isDemo = useIsDemoEnvironment();

  const steps = tourData;
  const [active, setActive] = useState(() => isDemo && isTourEnabled());
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

  useEffect(() => {
    localStorage.getItem(ENABLE_TOUR_KEY) === 'false' && setActive(false);
  }, []);

  return (
    <TourContext.Provider
      value={{
        total: steps.length - 1,
        current: current + 1,
        next,
        step: steps[current + 1],
        active,
        closeTour,
        setShowTourNextTime: setTourEnabled,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => useContext(TourContext);
