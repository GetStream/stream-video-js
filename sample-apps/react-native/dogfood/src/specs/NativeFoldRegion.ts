import { TurboModuleRegistry, type TurboModule } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

/**
 * The foldable hinge ("division" reserved region, iOS 27.1+) in window points.
 * `available` is false when there is none (not a foldable, closed, or an older
 * OS); the other fields are then zeroed.
 */
export type FoldDivision = {
  available: boolean;
  /** True while the device is partially folded. */
  active: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  marginLeft: number;
  marginRight: number;
  /** Hinge angle in whole degrees (180 is flat), -1 when unknown. */
  angle: number;
  /** 'closed' | 'partiallyOpen' | 'fullyOpen' | 'unknown' */
  status: string;
};

export interface Spec extends TurboModule {
  /** Returns the current hinge and starts reporting changes. */
  getDivision(): Promise<FoldDivision>;
  readonly onFoldDivisionChanged: EventEmitter<FoldDivision>;
}

// iOS only; there is no Android implementation
export default TurboModuleRegistry.get<Spec>('FoldRegion');
