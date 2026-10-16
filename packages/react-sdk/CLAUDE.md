`@stream-io/video-react-sdk`: the React UI layer on top of `@stream-io/video-react-bindings` (hooks) and `@stream-io/video-client` (core). It holds presentational components only; business logic belongs in the client.

## Layering rule

- Never read RxJS observables or `call.state` directly in this package, and never call `useObservableValue` here. All state access goes through the bindings hooks (`useCallStateHooks()`, `useCall()`).
- `useCallStateHooks()` returns a constant object, so destructuring it is cheap and stable. Destructure the hooks you need (`const { useParticipants } = useCallStateHooks()`) and call them; for React Compiler compatibility the `use-call-state-hooks` codemod hoists the destructuring to module scope.
- Device preference persistence lives in the client (`devicePersistence` option), not in this package.
- Background filters are MediaPipe-only (`BackgroundFiltersProvider`, `src/components/BackgroundFilters/`).

## Testing

Tests use Vitest in the `node` environment (`vite.config.mts`); nothing here needs a DOM, which keeps jsdom out of the devDependencies. Coverage is deliberately thin (`src/utilities/`, `src/core/components/CallLayout/`, `src/i18n/`); most behavioural testing happens in `@stream-io/video-client` and via the sample apps. `src/i18n/__tests__/catalogRenders.test.ts` renders every key in the generated catalog and asserts none surfaces as its own dotted path.

## Build

- ESM output is one file per source module (`preserveModules`) so consumers can tree-shake; CommonJS is a single bundle.
- `package.json#sideEffects` lists the CSS plus the entry files (they carry the top-level `setSdkInfo` call). Every other module must stay side-effect free, or tree-shaking silently stops working.
- CSS comes from `@stream-io/video-styling` (copied into `dist/` by `copy-css`). Class names follow `str-video__component-name--modifier`; theming is via CSS variables.

## Internationalization (i18n)

**The runtime is `@stream-io/i18n`**, shared with the React Native SDK and with Stream Chat — one
`Streami18n`, one set of formatters, one date layer. This package owns only what is genuinely its
own: the generated key catalog, `runtimeDefaults.ts`, and the React context binding.
`src/i18n/Streami18n.ts` is a thin subclass binding the catalog type parameters.

It is a **regular dependency, not a peer**: an integrator never imports `@stream-io/i18n`, they
import `Streami18n` from this package. Do not add `i18next` or `dayjs` as direct dependencies —
`Streami18n` calls `i18next.createInstance()`, so duplicate copies are harmless, but `dayjs` locale
registration _is_ global and must dedupe on core's range.

**English only, and there is no checked-in `en.json`.** The catalog has exactly one source: the
inline `defaultValue` at each `t()` call site. `yarn i18n:export` writes a JSON locale on demand
for a translator or TMS.

**Keys are stable dotted identifiers with the English copy inline:**

```tsx
const { t } = useI18n();
t('participantList.muteAll.label', 'Mute all'); // prose
t(
  'permissions.requestingToSpeak.text',
  '{{ userName }} is requesting to speak',
  { userName },
);
t('livestream.backstage.participantsJoinedEarly.text', {
  // plural: `count` is required and must be a number
  count: participantCount,
  formattedCount,
  defaultValue_one: '{{ formattedCount }} participant joined early',
  defaultValue_other: '{{ formattedCount }} participants joined early',
});
```

The inline default is what makes a partial custom dictionary safe — an unsupplied key still renders
English, never a raw dotted path — and it keeps the copy visible at the call site.

- **Namespaces follow the source tree** (`callControls.*`, `participantView.*`, `callRecordingList.*`), so
  keys are predictable from the component. Genuinely shared copy lives in `common.*`. Modality is
  the leaf: `.label`, `.ariaLabel`, `.placeholder`, `.title`, `.description`, `.text`.
- **Keys shared with the React Native SDK use identical strings** (`common.live.label`,
  `participantView.screenShare.stop.label`), so a customer shipping both platforms writes one
  dictionary.
- **`keySeparator: false` must stay.** Keys are flat strings that happen to contain dots; several
  contain `...` in their copy, which `keySeparator: '.'` would mis-resolve.
- **Typed keys:** `src/i18n/keys.ts` (generated, type-only) declares `TranslationCatalog`.
  `src/i18n/types.ts` derives `TranslationKey`, `TranslationDictionary` (strict),
  `LooseTranslationDictionary` and `StreamTFunction`, which is what `useI18n().t` is typed as — a
  typo is a compile error. `BundledKey` must never become `string`; that collapses the prose
  overload and silently disables all key checking.
- **`runtimeDefaults.ts` is empty**, and should stay that way. Resolve runtime values such as
  `CallingState` through `switch` statements of literal `t()` calls so codegen can extract the keys.
- **`yarn build-translations`** parses the `t()` call sites via `@stream-io/i18n/codegen` and
  regenerates `keys.ts`. It hard-fails on: a key used with two different inline copies; a key with
  no inline default and no `runtimeDefaults` entry (it would render as the raw dotted key); a key
  present in both; a bad plural shape; and a key that is a dotted prefix of another.
- **`yarn validate-translations`** regenerates and fails on any diff — the CI drift gate.

**Adding a translatable string:** call `t('namespace.component.thing.label', 'English copy')`, then
run `yarn build-translations`.

## Conventions and gotchas

- **Override props** (`ParticipantViewUI`, `VideoPlaceholder`, …) accept a `ComponentType`, a `ReactElement`, or `null` to disable. Render them with `isComponentType(X) ? <X /> : X`, never as `<X />` unconditionally.
- **Bind media elements in `useLayoutEffect`**, not `useEffect`: `call.bindVideoElement(...)` returns the cleanup. Don't attach tracks to elements yourself; the client's Dynascale decides which tracks play where.
- **Viewport tracking** (`call.viewportTracker.trackElementVisibility`) returns an unobserve function; always return it from the effect.
- **Identify participants by `sessionId`**, never `userId`.
- **Layouts that set a sort preset** (`call.setSortParticipantsBy`) must restore the call type's default on unmount (`CallTypes.get(call.type).options.sortParticipantsBy || defaultSortPreset`).
- **Mirror only the local participant's camera** (`participant.isLocalParticipant && trackType === 'videoTrack'`); never mirror screen share.
- **Never render the local participant's audio** (you would hear yourself).
- **Device lists can be empty on first render**; check `devices.length` before using them.
