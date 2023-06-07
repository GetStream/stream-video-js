import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useCallback,
  useEffect,
} from 'react';

import { useBreakpoint } from '../hooks/useBreakpoints';

export enum StepNames {
  Build = 1,
  Network = 2,
  Experience = 3,
  Invite = 4,
}

type Step = {
  header: string;
  explanation: string;
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
  const [steps, setSteps]: any = useState(undefined);
  const [active, setActive] = useState<boolean>(true);
  const [current, setCurrent]: any = useState(0);

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
  }, [current, steps]);
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
