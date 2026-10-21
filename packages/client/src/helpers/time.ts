import type { TimestampNS } from '../gen/coordinator';

/** Nanoseconds per millisecond — the only magic number in this module. */
export const NS_PER_MS = 1e6;

/** A wire timestamp as epoch milliseconds, for arithmetic against `Date.now()`. */
export const nsToMs = (ns: TimestampNS): number => Math.floor(ns / NS_PER_MS);

/** Epoch milliseconds as a wire timestamp. */
export const msToNs = (ms: number): TimestampNS =>
  (ms * NS_PER_MS) as TimestampNS;

/**
 * The local clock as a wire-comparable timestamp, for optimistic writes into
 * API-shaped objects. Millisecond resolution, so two writes within the same
 * millisecond produce equal timestamps.
 */
export const nowNs = (): TimestampNS => msToNs(Date.now());

/** A wire timestamp as a `Date`, for request payloads and date libraries. */
export const nsToDate = (ns: TimestampNS): Date => new Date(nsToMs(ns));

/** A `Date` as a wire timestamp. */
export const dateToNs = (date: Date): TimestampNS => msToNs(date.getTime());

/**
 * A server-sent timestamp as a `Date`, or `undefined` when absent or invalid.
 */
export const convertTimestampToDate = (
  timestamp?: TimestampNS | null,
): Date | undefined => {
  if (timestamp == null || !Number.isFinite(timestamp)) return undefined;
  const date = nsToDate(timestamp);
  return Number.isNaN(date.getTime()) ? undefined : date;
};
