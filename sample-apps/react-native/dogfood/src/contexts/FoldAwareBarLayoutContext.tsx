import React, { createContext, useContext } from 'react';
import { type LayoutChangeEvent, View } from 'react-native';

export type BarLayoutReporters = {
  /** onLayout for the bar above the participants (top controls). */
  onTopBarLayout: (event: LayoutChangeEvent) => void;
  /** Height of the controls below the participants, 0 when beside them. */
  setBottomBarHeight: (height: number) => void;
};

export const BarLayoutContext = createContext<BarLayoutReporters | undefined>(
  undefined,
);

/** Lets the call screen's bars report their size to `FoldAwareCallArea`. */
export const useFoldAwareBarLayout = () => useContext(BarLayoutContext);

/** Wraps the bar above the participants so its height can be measured. */
export const FoldAwareTopBar = ({ children }: React.PropsWithChildren) => {
  const barLayout = useFoldAwareBarLayout();
  return <View onLayout={barLayout?.onTopBarLayout}>{children}</View>;
};
