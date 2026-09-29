import { useEffect, useState } from 'react';
import NativeFoldRegion, { type FoldDivision } from '../specs/NativeFoldRegion';

export type { FoldDivision };

/**
 * Returns the current foldable hinge (iOS 27.1+), or `undefined` when there
 * is none (not a foldable, closed, unsupported platform or OS version).
 */
export const useFoldDivision = (): FoldDivision | undefined => {
  const [division, setDivision] = useState<FoldDivision>();

  useEffect(() => {
    if (!NativeFoldRegion) return;
    let mounted = true;
    const update = (value: FoldDivision) => {
      if (mounted) setDivision(value.available ? value : undefined);
    };
    // subscribe first, getDivision() starts the native observation
    const subscription = NativeFoldRegion.onFoldDivisionChanged(update);
    NativeFoldRegion.getDivision()
      .then(update)
      .catch((err: unknown) => {
        console.warn('FoldRegion.getDivision failed', err);
      });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return division;
};
