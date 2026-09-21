/** Nanoseconds per millisecond — the only magic number in this module. */
export const NS_PER_MS = 1e6;

/** A wire timestamp as epoch milliseconds, for arithmetic against `Date.now()`. */
export const nsToMs = (ns: number): number => Math.floor(ns / NS_PER_MS);

/** Epoch milliseconds as a wire timestamp. */
export const msToNs = (ms: number): number => ms * NS_PER_MS;

/**
 * The local clock as a wire-comparable timestamp, for optimistic writes into
 * API-shaped objects. Millisecond resolution, so two writes within the same
 * millisecond produce equal timestamps.
 */
export const nowNs = (): number => msToNs(Date.now());

/** A wire timestamp as a `Date`, for request payloads and date libraries. */
export const nsToDate = (ns: number): Date => new Date(nsToMs(ns));

/** A `Date` as a wire timestamp. */
export const dateToNs = (date: Date): number => msToNs(date.getTime());

/**
 * A server-sent timestamp as a `Date`, or `undefined` when there is none.
 *
 * The guarded companion to {@link nsToDate}, for the boundary where a wire
 * timestamp becomes something a date library or a UI prop consumes. Use
 * {@link nsToDate} when the value is known to be present; use this when it comes
 * straight off a response, an event or persisted state.
 *
 * The guard covers two cases that are silent rather than loud: an absent value
 * (`nsToDate(undefined as never)` yields an `Invalid Date`, and
 * `.toISOString()` on one throws `RangeError`, typically mid-render) and a
 * non-finite one (a malformed payload or hand-built fixture producing `NaN`).
 */
export const convertTimestampToDate = (
  timestamp?: number | null,
): Date | undefined => {
  if (timestamp == null || !Number.isFinite(timestamp)) return undefined;
  return nsToDate(timestamp);
};
