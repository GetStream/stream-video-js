import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { OffsetOptions, Placement } from '@floating-ui/react';
import { useBreakpoint } from '../hooks';
import { useIsDemoEnvironment } from './AppEnvironmentContext';
import { TourSDKOptions } from '../components/TourPanel/TourSDKOptions';
import { STORAGE_DONT_DISPLAY_TOUR } from '../components/TourPanel';
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
    This video calling experience is just 1 example of what you can build with Stream’s SDKs.`,
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
  explanation: `A full chat SDK/API with reactions, typing, unread counts, quoted replies, URL previews, image uploads, and basically anything you’d expect from a whatsapp or slack style app.`,
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

  useEffect(() => {
    localStorage.getItem(STORAGE_DONT_DISPLAY_TOUR) === 'false' &&
      setActive(false);
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
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => useContext(TourContext);
