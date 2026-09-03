/**
 * An error thrown when a client-side SFU deadline (e.g., waiting for the
 * signaling WS to open or for the `joinResponse` to arrive) fires before
 * the awaited operation resolves. Allows consumers (e.g., the client event
 * reporter) to classify timeouts without relying on message wording.
 */
export class SfuTimeoutError extends Error {}
