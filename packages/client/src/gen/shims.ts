import type { TargetResolution } from './coordinator';

export type TargetResolutionRequest = TargetResolution;
export type TargetResolutionResponse = Required<TargetResolution>;

/**
 *
 * @export
 * @interface Bound
 */
export interface Bound {
  /**
   *
   * @type {boolean}
   * @memberof Bound
   */
  inclusive: boolean;
  /**
   *
   * @type {number}
   * @memberof Bound
   */
  value: number;
}

/**
 *
 * @export
 * @interface DailyAggregateCallStatsResponse
 */
export interface DailyAggregateCallStatsResponse<T = any> {
  /**
   *
   * @type {string}
   * @memberof DailyAggregateCallStatsResponse<T>
   */
  date: string;
  /**
   *
   * @type {T}
   * @memberof DailyAggregateCallStatsResponse<T>
   */
  report: T;
}
