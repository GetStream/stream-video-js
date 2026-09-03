// Re-exported so downstream packages resolve exactly one copy of the class.
// Two installs of @stream-io/state-store would be structurally identical but
// nominally distinct to TypeScript (it has a `protected` field), which breaks
// assignability across package boundaries.
export { StateStore } from '@stream-io/state-store';

// The reactive surface consumers actually touch. Deliberately narrow: the
// helpers left out below (`resolvePatch`, `preserveArrayIdentity`,
// `isShallowArrayEqual`, `createSubscription`, `createSafeAsyncSubscription`,
// `serializeAsync`) are internal plumbing, and exporting them is how `RxUtils`
// became public API by accident in the first place. Import them from their
// modules inside the package.
export {
  createSubscribable,
  field,
  firstValue,
  select,
  type Observer,
  type Subscribable,
  type Subscription,
} from './subscribable';

// `Patch` appears in the public setter signatures on `CallState`.
export type { Patch } from './patch';

export * from './CallingState';
export * from './stateStore';
export * from './CallState';
