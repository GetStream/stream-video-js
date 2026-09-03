# Migrating from RxJS to `@stream-io/state-store`

Stream Video's JavaScript SDKs no longer use RxJS internally, and no longer
expose RxJS types on their public API. State is now held in
[`@stream-io/state-store`](https://www.npmjs.com/package/@stream-io/state-store),
the same substrate used by Stream Chat and Feeds.

## Why

- **Atomic updates.** A single server payload used to be applied field by
  field, so a subscriber reading a second field from inside its callback could
  observe a half-applied payload. Every subscriber now sees a consistent
  snapshot.
- **One less runtime dependency**, and with it a class of RxJS version
  conflicts in host apps.
- **Tear-free React bindings.** The hooks are built on `useSyncExternalStore`.
- **Far cheaper synchronous reads.** `call.state.participants` used to open and
  close a subscription on every access.

## Measured impact

Numbers below come from a benchmark harness that builds this branch and the
pre-migration commit side by side and runs both in one process. Each suite
reports the median of its own repeats (7 for the store benchmarks, 5 for
element binding); the figures here are the median across three such runs, on
one machine. Treat them as the shape of the change rather than exact values.

The harness itself is not part of this change - it lands separately.

### Bundle

An application bundle including the SDK **and** the reactive runtime it needs:

| metric   | before   | after    | delta                |
| -------- | -------- | -------- | -------------------- |
| minified | 456.2 kB | 431.6 kB | **-24.6 kB (-5.4%)** |
| gzip     | 133.1 kB | 126.2 kB | **-6.9 kB (-5.2%)**  |
| brotli   | 114.7 kB | 108.8 kB | -5.9 kB (-5.2%)      |

The client's own `dist` grows by ~18 kB minified (~7 kB gzipped), because the
primitives that replace the RxJS operators now live inside it. The application
still comes out ahead by not shipping RxJS.

### Element binding - where it matters most

One binding exists per participant tile, so a large call has hundreds live at
once. This is the densest subscriber in the SDK and the clearest win:

| what                                                    | before  | after      |
| ------------------------------------------------------- | ------- | ---------- |
| bind + unbind a 100-tile grid                           | 5.9 ms  | **4.2 ms** |
| 100 bound tiles, 1k participant updates                 | 16.9 ms | **7.2 ms** |
| 100 bound tiles, 500 publish/unpublish flips            | 8.2 ms  | **3.5 ms** |
| React Native per-tile subscriber, 100 tiles, 1k updates | 21.4 ms | **6.7 ms** |

Each video binding used to build three deduplicating sources; it is now one
store subscription that reads the participant once and compares what it cares
about. The React Native tile subscriber went from `combineLatest` over three
derived sources to two subscriptions and a synchronous re-read.

### Everything else

Measured with both sides written idiomatically - RxJS using `combineLatest` and
`distinctUntilChanged`, state-store using a single `subscribeWithSelector` - so
neither side is a strawman. "Wakes" counts how often a subscriber handler runs,
which is what becomes a React render.

| what                                      | before         | after             |
| ----------------------------------------- | -------------- | ----------------- |
| `state.participants` read                 | 86.9 ms / 100k | **0.3 ms / 100k** |
| `state.callingState` read                 | 26.3 ms / 100k | **0.3 ms / 100k** |
| subscribe + unsubscribe                   | 14.8 ms / 20k  | **2.1 ms / 20k**  |
| torn reads over 1k payloads               | 1000           | **0**             |
| wakes, payload changing 6 selected fields | 12000          | **2000**          |
| 100 participant tiles, 2k updates         | 37.1 ms        | **21.1 ms**       |
| blended live-call workload                | 3.7 ms         | 16.2 ms           |
| 100-participant call, 2k speaker switches | 14.1 ms        | 19.7 ms           |
| heap, 200 `CallState` instances           | 5.7 MB         | 7.9 MB            |

Reads, teardown, consistency, multi-field payloads and element binding improve.
The raw write path costs more: one store update allocates a new state object and
recomputes derived state eagerly, where the old code did neither until something
subscribed.

### The write path, in detail

Writes are the one place this migration costs more, so they get their own
suite. The ratios look alarming and the absolute
numbers mostly do not; both are below. The last column is the one that decides
whether a row matters: CPU time per wall-clock second for a call doing 100
state writes a second, which is roughly what a busy 50-participant call
produces.

| what                                           | before  | after      | per write       | CPU/s    |
| ---------------------------------------------- | ------- | ---------- | --------------- | -------- |
| scalar write, no subscribers                   | 13 ns   | 60 ns      | 4.7x slower     | 0.006 ms |
| scalar write, 1 subscriber                     | 21 ns   | 74 ns      | 3.4x slower     | 0.007 ms |
| scalar write, 20 subscribers on other fields   | 16 ns   | 74 ns      | 4.5x slower     | 0.007 ms |
| scalar write, 50-participant roster loaded     | 16 ns   | 62 ns      | 3.9x slower     | 0.006 ms |
| full server payload (`updateFromCallResponse`) | 938 ns  | **375 ns** | **2.5x faster** | 0.038 ms |
| six fields, best available on each side        | 379 ns  | **128 ns** | **3.0x faster** | 0.013 ms |
| participant patch, 10-participant call         | 1.1 µs  | **561 ns** | **1.9x faster** | 0.056 ms |
| participant patch, 50-participant call         | 2.1 µs  | 2.4 µs     | 1.2x slower     | 0.243 ms |
| participant patch, 200-participant call        | 5.9 µs  | 9.4 µs     | 1.6x slower     | 0.945 ms |
| participant patch, 400-participant call        | 11.2 µs | 19.4 µs    | 1.7x slower     | 1.945 ms |
| participant patch, 100 participants, no subs   | 3.4 µs  | 4.8 µs     | 1.4x slower     | 0.483 ms |
| SFU join payload, 100 participants             | 23.4 µs | 22.1 µs    | no change       | 2.214 ms |

Four things worth taking from that table:

- **Scalar writes are 3-5x slower and it does not matter.** 60-75 ns each, and
  well under a hundredth of a millisecond of CPU per second at any realistic
  write rate. This is the cost of allocating a new state object instead of
  pushing a subject.
- **The derivation guard holds.** A write to an unrelated field costs the same
  with a 50-participant roster loaded as with none (62 ns vs 60 ns), because
  the preprocessor only recomputes when the participant list identity actually
  changes.
- **Server payloads got faster**, because they are now one write rather than
  15+ subject pushes. Batching six fields through `setState` is 3x faster than
  six setters on either side.
- **The real cost is participant churn, and it scales with the call.** Every
  participant write re-sorts the roster and rebuilds five derived collections
  plus the session-ID index, eagerly, where RxJS derived nothing until someone
  subscribed. The derivation is a single pass over the roster (it was six - a `find`,
  `filter` or `some` each - which cost about 20% more), but the sort and the
  pass still scale with the call. The crossover is around 50 participants; at
  400 it is 1.7x slower and 19 µs per write, or ~1.9 ms of CPU per second at
  100 writes/s, about 0.19% of one core. It is the row to watch if very large
  calls become a target.

Wake counts, and therefore React render counts, are unchanged or lower in every
exercise, so the subscribing side gets the write-path cost back several times
over.

## What changed

### `.subscribe()` — unchanged

Both the callback and observer forms keep working:

```ts
call.state.callingState$.subscribe((state) => console.log(state));
call.state.callingState$.subscribe({ next: (state) => console.log(state) });
```

The returned subscription is callable _and_ has `.unsubscribe()`, so existing
teardown code keeps working too.

### `.pipe()` — no longer available

RxJS operators are gone along with the dependency. Most code only ever used
`.subscribe()`, which is unaffected.

If you do need operators, bridge the source into your own RxJS once:

```ts
import { Observable } from 'rxjs';
import type { Subscribable } from '@stream-io/video-client';

export const toObservable = <T>(source: Subscribable<T>) =>
  new Observable<T>((subscriber) => {
    const subscription = source.subscribe((value) => subscriber.next(value));
    return () => subscription.unsubscribe();
  });
```

```diff
-call.state.participants$.pipe(debounceTime(300)).subscribe(render);
+toObservable(call.state.participants$).pipe(debounceTime(300)).subscribe(render);
```

RxJS becomes a dependency of _your_ app rather than of the SDK.

Reaching for RxJS is often unnecessary, though. State is synchronous, so most
things that used to need an operator are now just a read:

```ts
// instead of a derived stream, read it
const count = call.state.participants.length;

// instead of combineLatest, read what you need when something changes
call.state.store.subscribeWithSelector(
  (state) => ({
    callingState: state.callingState,
    participants: state.participants,
  }),
  ({ callingState, participants }) => render(callingState, participants),
);
```

The SDK deliberately ships no timing operators (`debounceTime` and friends).
Coalescing updates is a concern of the code doing the rendering, and is a few
lines where it is needed:

```ts
let timeout: ReturnType<typeof setTimeout> | undefined;
const subscription = call.state.participants$.subscribe((participants) => {
  clearTimeout(timeout);
  timeout = setTimeout(() => render(participants), 300);
});
```

### Reading a value synchronously

Every `Subscribable` has a current value, so the `RxUtils` helpers are gone:

```diff
-RxUtils.getCurrentValue(call.state.participants$)
+call.state.participants$.getValue()
+// or simply
+call.state.participants
```

`RxUtils` is **removed** from the public API. `setCurrentValue`,
`createSubscription`, `updateValue` and friends were internal plumbing; state is
now written through the documented setters (`call.state.setCallingState(...)`).

The replacement surface is deliberately narrow, so the same thing does not
happen again. Public: `StateStore`, `Subscribable`, `Subscription`, `Observer`,
`Patch`, and the `createSubscribable` / `field` / `select` / `firstValue`
helpers. Internal, and not exported: `resolvePatch`, `preserveArrayIdentity`,
`isShallowArrayEqual`, `createSubscription`, `createSafeAsyncSubscription`,
`serializeAsync`.

### Device lists resolve asynchronously

`listDevices()` returns a `Subscribable` that reports an empty array until the
first enumeration completes. Awaiting the first emission no longer means
"await the loaded list" — use the load helpers instead:

```diff
-const devices = await firstValueFrom(getAudioDevices());
+const devices = await loadAudioDevices();
```

`loadVideoDevices`, `loadAudioOutputDevices` and `loadDeviceIds` mirror this.

### React bindings

Every existing hook keeps its exact signature. `useObservableValue` still works
but is deprecated and now takes a `Subscribable`.

New: read several values in one tear-free subscription.

```ts
const selector = (state: CallStateShape) => ({
  callingState: state.callingState,
  participantCount: state.participantCount,
});

const { callingState, participantCount } = useCallStateSelector(selector);
```

The selector must be referentially stable — declare it at module scope or wrap
it in `useCallback`.

## Writing per-participant selectors

In a large call, every tile typically watches one participant. Look participants
up through the index rather than scanning, or a single participant update costs
O(participants x tiles):

```ts
// good - constant time
select(call.state.store, (state) => state.participantsBySessionId[sessionId]);

// avoid - re-scans the array in every tile on every update
select(call.state.store, (state) =>
  state.participants.find((p) => p.sessionId === sessionId),
);
```

`call.state.findParticipantBySessionId(sessionId)` uses the index too.

Cost of one participant update, with N tiles each watching one participant:

| participants (= tiles) | scanning selector | index selector |
| ---------------------- | ----------------- | -------------- |
| 100                    | 21.8 µs           | 10.2 µs        |
| 200                    | 54.1 µs           | 19.9 µs        |
| 400                    | 193.4 µs          | 41.6 µs        |

The index scales linearly with the number of tiles; scanning does not.

## Behaviour changes worth knowing

- **`rawParticipants` is deprecated.** Sorting has always been applied in place,
  so it was never actually independent of the sort preset. It is an alias for
  `participants`.
- **`setSortParticipantsBy` now re-renders immediately.** It previously emitted
  the same array reference, which React bailed out of, so a re-sort was only
  visible after the next participant change.
- **`hasBrowserPermission` is `false` until the permission state is known**,
  rather than not emitting at all. To wait for a determination, await
  `browserPermissionState$`, which stays `undefined` until it is known.
- **Reading `callStatsReport` off the store needs an explicit registration.**
  Collecting WebRTC stats is expensive, so the SDK only does it while something
  is watching. Subscribing to `callStatsReport$` (or using `useCallStatsReport`)
  still counts, and needs nothing extra. A store subscription cannot say which
  fields it reads, so register the interest yourself when you go through
  `useCallStateSelector` or `store.subscribeWithSelector` — otherwise the report
  stays `undefined`:

  ```ts
  useEffect(() => call.state.observeCallStatsReport(), [call]);
  ```

- **`deviceIds$` is always defined.** It used to be `undefined` in environments
  that cannot enumerate devices, decided when the module was first imported -
  which left it permanently inert when that first import happened during SSR.
  It is now a `Subscribable` that simply reports an empty list where enumeration
  is unavailable, so the `deviceIds$ && ...` null checks can go.
- **`rxjs` is no longer installed transitively.** Apps that relied on that must
  add it to their own `package.json`.
