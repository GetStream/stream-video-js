import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

import { Placement } from '@floating-ui/react';

import { useBreakpoint } from '../hooks/useBreakpoints';

import { useIsProntoEnvironment } from '../context/AppEnvironmentContext';

export const tourData: Step[] = [
  {
    header:
      'Stream’s Video & Audio SKD is designed to support Livestreaming & Audio Rooms.',
    explanation: 'To get more details contact an expert',
    placement: 'bottom-start',
    anchor: '.rd__call-header-title',
  },
  {
    header: 'Larger network, faster connections. ',
    explanation:
      'SFU Cascading and EDGE Network ensures low latency and high video quality consistently.',
    placement: 'left-start',
    anchor: '.rd__header__elapsed',
  },
  {
    header: 'Seamless Chat Integration out-of-the-box',
    explanation:
      'Build real-time chat messaging in less time. Rapidly ship in-call messaging with our highly reliable chat infrastructure. Try sending the first message!',
    placement: 'left-start',
    anchor: '.str-video__chat',
    delay: 200,
  },
  {
    header: 'Participant features, host controls and more.',
    explanation:
      'Test these features for yourself and add more users to the demo call.',
    placement: 'left-start',
    anchor: '.rd__participants',
    delay: 200,
  },
];

export enum StepNames {
  Start = 1,
  Network = 2,
  Chat = 3,
  Invite = 4,
}

type Step = {
  header: string;
  explanation: string;
  anchor: string;
  placement: Placement;
  delay?: number;
  image?: {
    src: string;
  };
};

type Props = {
  next: () => void;
  setSteps: (steps: Step[]) => void;
  current: number;
  total: number;
  step: Step | undefined;
  active: boolean;
  toggleTour: () => void;
};

const TourContext = createContext<Props>({
  next: () => null,
  setSteps: () => null,
  current: 0,
  total: 0,
  step: undefined,
  active: false,
  toggleTour: () => null,
});

export const TourProvider = ({ children }: { children: ReactNode }) => {
  const isPronto = useIsProntoEnvironment();

  const [steps, setSteps]: any = useState<Step[] | undefined>(undefined);
  const [active, setActive] = useState<boolean>(isPronto);
  const [current, setCurrent]: any = useState<number>(0);

  const breakpoint = useBreakpoint();

  useEffect(() => {
    setSteps(tourData);
  }, [setSteps]);

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
        setSteps,
        total: steps?.length,
        current: current + 1,
        next,
        step: steps?.[current],
        active,
        toggleTour,
      }}
    >
      {children}
    </TourContext.Provider>
  );
};

export const useTourContext = () => useContext(TourContext);
