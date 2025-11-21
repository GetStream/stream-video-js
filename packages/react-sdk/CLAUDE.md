## Overview

This is `@stream-io/video-react-sdk`, the official React SDK for Stream Video.
It provides React components and hooks for building video calling, audio rooms, and livestreaming applications.
This package sits on top of `@stream-io/video-react-bindings` (React hooks layer) and `@stream-io/video-client` (core WebRTC client).

**Key characteristics:**

- Pure UI layer - no direct WebRTC/state management logic
- Thin wrappers around bindings hooks with styled components
- Highly composable and customizable component architecture
- CSS-based styling from separate `@stream-io/video-styling` package
- Minimal business logic - delegates to client and bindings layers

## Build & Development Commands

```bash
# Build the SDK
yarn build

# Watch mode (rebuilds on changes)
yarn start

# Clean build artifacts
yarn clean
```

### Monorepo Commands

From the root of the monorepo:

```bash
# Build react-sdk with all dependencies
yarn build:react:deps

# Build just the react-sdk
yarn build:react:sdk

# Watch mode for react-sdk
yarn start:react:sdk

# Build all packages in dependency order
yarn build:all

# Lint all packages
yarn lint:all

# Run tests across all packages
yarn test:ci:all

# Run the dogfood sample app (for testing)
yarn start:react:dogfood
```

## Testing

The react-sdk package has minimal tests (only a few unit tests in `src/utilities/filter.test.ts` and `src/core/components/CallLayout/partcipantFilter.test.ts`). Tests use Vitest.

- Run tests: `yarn test` (from client package or root)
- Tests are primarily in the `@stream-io/video-client` package
- Most testing happens via integration testing in sample apps

## Package Structure

```
packages/react-sdk/
├── src/
│   ├── components/         # UI components (Avatar, Button, CallControls, etc.)
│   ├── core/              # Core components and hooks
│   │   ├── components/    # Core components (StreamVideo, StreamCall, ParticipantView, etc.)
│   │   └── hooks/         # Core hooks (useCallStateHooks, etc.)
│   ├── hooks/             # Additional hooks (device management, scroll, permissions)
│   ├── translations/      # i18n translations
│   ├── utilities/         # Utility functions
│   └── wrappers/          # Component wrappers (LivestreamPlayer)
├── dist/                  # Build output (do not edit)
├── index.ts              # Main entry point
├── rollup.config.mjs     # Build configuration
└── package.json
```

## Architecture

### Three-Layer Architecture

The SDK follows a strict layered architecture where responsibilities are cleanly separated:

1. **@stream-io/video-client** (Core Layer)
   - Low-level WebRTC client
   - Manages connections, state via RxJS observables (BehaviorSubject pattern)
   - Platform-agnostic (browser/Node.js)
   - Contains ALL business logic, no UI concerns
   - See `packages/client/AGENTS.md` for details

2. **@stream-io/video-react-bindings** (Hooks Layer)
   - React hooks that subscribe to client observables
   - Uses `use-sync-external-store` for React 18 concurrent mode compatibility
   - State synchronization between client and React components
   - NO UI components, pure hooks only
   - Example hooks: `useCallState`, `useParticipants`, `useLocalParticipant`
   - Provides `useCallStateHooks()` - factory hook that returns all state hooks
   - Provides context providers: `StreamVideoProvider`, `StreamCallProvider`

3. **@stream-io/video-react-sdk** (UI Layer - this package)
   - React components built on top of bindings
   - Pre-built UI components for common use cases
   - Styled with CSS from `@stream-io/video-styling`
   - Customizable via props and theming
   - NO business logic - purely presentational

**Critical Rule:** This package (react-sdk) should NEVER directly import or use RxJS observables from the client. All state access must go through bindings hooks.

### Core Components

**Entry Points:**

- `StreamVideo` - Provider component wrapping the application, manages client instance
- `StreamCall` - Wraps a specific call, provides call context to children

**Layout Components:**

- `SpeakerLayout` - Spotlight on active speaker with sidebar participants
- `PaginatedGridLayout` - Grid view with pagination for large calls
- `LivestreamLayout` - Optimized for livestreaming with host/viewers
- `PipLayout` - Picture-in-picture layout

**Participant Components:**

- `ParticipantView` - Displays a single participant's video/audio
- `Video` - Renders video stream with media element bindings
- `Audio` - Renders audio stream

**UI Components:**

- `CallControls` - Control buttons (mute, camera, screen share, etc.)
- `CallParticipantsList` - List of participants with metadata
- `DeviceSettings` - Device selection UI (camera, microphone, speaker)
- `CallStats` - Display call quality statistics
- `BackgroundFilters` - Video background effects UI
- `NoiseCancellation` - Noise cancellation controls
- And many more in `src/components/`

### Styling

Styling is managed by `@stream-io/video-styling` package:

- CSS is built separately using Sass
- Copied to `dist/` during build via `copy-css` script
- Components use CSS class names that match the styling package
- Theming via `StreamTheme` component and CSS variables

### Hooks

**Core Hooks** (from `@stream-io/video-react-bindings`):

- State hooks: `useCallState`, `useParticipants`, `useRemoteParticipants`, etc.
- Action hooks: `useCallMicrophone`, `useCallCamera`, `useCallScreenShare`
- Permission hooks: `useCallPermissions`

**SDK-Specific Hooks** (this package):

- `useDeviceList` - List available cameras, microphones, speakers
- `usePersistedDevicePreferences` - Persist device selection to localStorage
- `useRequestPermission` - Request media permissions
- `useScrollPosition` - Track scroll position (for pagination)
- `useFilteredParticipants` - Filter participants based on predicate

### Key Patterns & Architecture Deep Dive

#### 1. Context-Based Architecture

All components rely on React Context provided by entry point components:

```typescript
<StreamVideo client={client}>
  <StreamCall call={call}>
    {/* All components have access to client and call context */}
    <SpeakerLayout />
  </StreamCall>
</StreamVideo>
```

**How it works:**

- `StreamVideo` is a thin wrapper around `StreamVideoProvider` from bindings
  - Adds translation overrides from `src/translations/en.json`
  - Makes client available to all children via context
- `StreamCall` is literally a re-export of `StreamCallProvider` from bindings
  - Makes call instance available to all children via context
  - Both `useCall()` and `useCallStateHooks()` depend on this context

#### 2. The useCallStateHooks Pattern

This is the **most important pattern** in the SDK. Instead of importing individual hooks, components use a factory:

```typescript
const { useParticipants, useMicrophoneState, useCameraState } =
  useCallStateHooks();
const participants = useParticipants();
const microphoneState = useMicrophoneState();
```

**Why this pattern?**

- Single source of truth for all call state hooks
- Type-safe access to 50+ state hooks without importing each one
- Hooks are bound to the call in context automatically
- Easier to discover available hooks via autocomplete

**Located in:** `@stream-io/video-react-bindings/src/hooks/callStateHooks.ts`

#### 3. Observable → Hook Bridge

The bindings layer uses `useObservableValue()` to bridge RxJS → React:

```typescript
// In bindings (callStateHooks.ts)
export const useParticipants = () => {
  const { participants$ } = useCallState();
  return useObservableValue(participants$); // Subscribes and returns current value
};
```

**Under the hood:** Uses `useSyncExternalStore` (React 18+) for concurrent mode support.

**Critical:** react-sdk components should NEVER call `useObservableValue` directly. Always use hooks from bindings.

#### 4. Component Composition Pattern

React-sdk components follow a strict composition hierarchy:

```
Layout (SpeakerLayout, PaginatedGridLayout)
  └─ ParticipantView (renders one participant)
      ├─ Video (video element + bindings)
      ├─ Audio (audio element + bindings)
      └─ ParticipantViewUI (overlay with name, icons, menu)
```

**Example from SpeakerLayout:**

1. Layout fetches participants via `useFilteredParticipants()`
2. Renders one `ParticipantView` per participant
3. `ParticipantView` handles media binding via `call.bindVideoElement()`
4. Layout has NO direct knowledge of video elements or tracks

#### 5. Ref Forwarding for Media Elements

Video and audio elements need refs for two purposes:

- **DynascaleManager:** Track viewport visibility for bandwidth optimization
- **User callbacks:** Allow integrators to access elements

**Pattern used:**

```typescript
<ParticipantView
  refs={{
    setVideoElement: (el) => { /* custom logic */ },
    setVideoPlaceholderElement: (el) => { /* custom logic */ }
  }}
/>
```

**Implementation in ParticipantView:**

- Maintains internal refs for context
- Calls user-provided refs as well (callback refs pattern)
- Forwards final video element ref to `useTrackElementVisibility`

#### 6. Viewport Visibility Tracking (Dynascale Integration)

**Critical for performance:** Only visible participants receive high-quality video.

```typescript
// In ParticipantView
useTrackElementVisibility({
  sessionId: participant.sessionId,
  trackedElement: participantViewElement, // The wrapping div
  trackType: 'videoTrack' | 'screenShareTrack',
});
```

**What happens:**

- Hook calls `call.dynascaleManager.trackElementVisibility()`
- Uses IntersectionObserver to detect when element enters/exits viewport
- Client automatically requests lower resolution for invisible participants
- Returns cleanup function to unobserve on unmount

**Located in:** `src/core/hooks/useTrackElementVisibility.ts`

#### 7. Media Element Binding

Video/audio elements don't directly receive tracks. The client manages this:

```typescript
// In Video component
useLayoutEffect(() => {
  if (!call || !videoElement || trackType === 'none') return;

  const cleanup = call.bindVideoElement(videoElement, sessionId, trackType);

  return () => cleanup?.();
}, [call, trackType, sessionId, videoElement]);
```

**Why this approach?**

- Client controls which tracks go to which elements (Dynascale)
- Handles track replacement seamlessly
- Manages audio routing through AudioContext for advanced features
- Components don't need to know about MediaStreamTrack APIs

#### 8. Participant Filtering System

Layouts support complex participant filtering via filter objects or predicates:

```typescript
// Predicate approach
<SpeakerLayout
  filterParticipants={(p) => p.roles.includes('speaker')}
/>

// Filter object approach (MongoDB-like queries)
<SpeakerLayout
  filterParticipants={{
    $or: [
      { isPinned: true },
      { roles: { $contains: 'host' } }
    ]
  }}
/>
```

**Implementation:** `applyFilter()` utility in `src/utilities/filter.ts`

**Supported operators:**

- `$and`, `$or`, `$not` - Boolean logic
- `$eq`, `$neq`, `$in` - Equality
- `$gt`, `$gte`, `$lt`, `$lte` - Comparison (including dates)
- `$contains` - Array membership

#### 9. Layout-Specific Sort Presets

Each layout applies a different participant sorting strategy via the client:

```typescript
// In SpeakerLayout
useSpeakerLayoutSortPreset(call, isOneOnOneCall);

// Implementation
useEffect(() => {
  if (!call) return;
  call.setSortParticipantsBy(speakerLayoutSortPreset); // From client
  return () => resetSortPreset(call); // Restore default on unmount
}, [call]);
```

**Sort presets** (from `@stream-io/video-client`):

- `speakerLayoutSortPreset` - Screen share → dominant speaker → speaking → pinned
- `paginatedLayoutSortPreset` - Stable sorting for paginated views
- `defaultSortPreset` - Default for call type

**Important:** Sorting is **visibility-aware** in the client - only invisible participants are re-sorted to avoid UI jank.

#### 10. Device Management Pattern

Device selection is handled through persisted preferences:

```typescript
// At app level - automatically applies and persists device choices
usePersistedDevicePreferences('@stream-io/device-prefs');

// In components - get current devices
const { useDeviceList } = useCallStateHooks();
const { devices, selectedDevice } = useDeviceList(devices, selectedDeviceId);
```

**Flow:**

1. `usePersistedDevicePreferences` reads from localStorage on mount
2. Applies saved device IDs via `call.camera.select()`, `call.microphone.select()`
3. Maintains fallback strategy if saved device unavailable (tries label match, then default)
4. Persists changes back to localStorage when devices change
5. Stores history of last 3 devices per type

**Located in:** `src/hooks/usePersistedDevicePreferences.ts` (383 lines - complex!)

#### 11. Background Filters Integration

Background blur/replacement uses a separate filter pipeline:

```typescript
<BackgroundFiltersProvider
  backgroundFilter="blur"
  backgroundBlurLevel="high"
  basePath="https://unpkg.com/@stream-io/video-filters-web/tf"
>
  <MyVideoApp />
</BackgroundFiltersProvider>

// In components
const { applyBackgroundBlurFilter, isReady } = useBackgroundFilters();
```

**Architecture:**

- Provider loads TensorFlow Lite WASM + models
- Registers filter via `call.camera.registerFilter()`
- Filter receives MediaStream, renders to canvas, returns filtered stream
- Uses hidden video element + canvas + optional background image element
- Client automatically uses filtered stream instead of raw camera

**Located in:** `src/components/BackgroundFilters/BackgroundFilters.tsx`

#### 12. Permission-Based UI Rendering

Components use the `Restricted` wrapper to conditionally render based on permissions:

```typescript
// In CallControls
<Restricted requiredGrants={[OwnCapability.SEND_AUDIO]}>
  <ToggleAudioPublishingButton />
</Restricted>
```

**How it works:**

- `Restricted` component from bindings checks `call.permissionsContext`
- Only renders children if user has required capabilities
- Capabilities come from backend call settings + user role
- Updates reactively when permissions change

#### 13. Internationalization (i18n)

Translations are provided via i18next integration in bindings:

```typescript
// StreamVideo passes translations to provider
<StreamVideoProvider translationsOverrides={translations} {...props} />

// In components
const { t } = useI18n(); // From bindings
return <span>{t('Mute')}</span>;
```

**Translation files:** `src/translations/en.json` (only English included in SDK)

Users can override translations by passing `translationsOverrides` prop to `StreamVideo`.

#### 14. Video Placeholder Pattern

When video is not available, components show placeholder UI:

```typescript
<Video
  VideoPlaceholder={CustomPlaceholder}
  PictureInPicturePlaceholder={CustomPiPPlaceholder}
  participant={participant}
  trackType="videoTrack"
/>
```

**Rendering logic:**

- Shows video element when: participant publishing video + visible + not paused
- Shows VideoPlaceholder when: no video track, invisible, or video paused
- Shows PictureInPicturePlaceholder when: video is playing in PiP mode

**Default placeholders:**

- `DefaultVideoPlaceholder` - Shows avatar + participant name
- `DefaultPictureInPicturePlaceholder` - Shows "In Picture-in-Picture" message

#### 15. Component Override Pattern

Most components accept UI override props for customization:

```typescript
<SpeakerLayout
  ParticipantViewUISpotlight={CustomSpotlightUI}
  ParticipantViewUIBar={CustomBarUI}
  VideoPlaceholder={CustomPlaceholder}
/>
```

**Types of overrides:**

- `ComponentType` - Renders as `<CustomUI />`
- `ReactElement` - Renders directly
- `null` - Disables that UI element entirely

**Check before rendering:**

```typescript
{isComponentType(ParticipantViewUI) ? (
  <ParticipantViewUI />
) : (
  ParticipantViewUI
)}
```

#### 16. Audio Handling Pattern

Audio is simpler than video (no visibility concerns):

```typescript
// In ParticipantView - audio always rendered if present
{!isLocalParticipant && !muteAudio && (
  <>
    {hasAudioTrack && (
      <Audio participant={participant} trackType="audioTrack" />
    )}
    {hasScreenShareAudioTrack && (
      <Audio participant={participant} trackType="screenShareAudioTrack" />
    )}
  </>
)}
```

**Key points:**

- Local participant always muted (don't hear yourself)
- Screen share audio rendered separately
- `muteAudio` prop for advanced use cases (e.g., audio-only mode)
- Audio elements are invisible (display: none in CSS)

## Build System

- **Rollup** for bundling (see `rollup.config.mjs`)
- Produces 2 bundles:
  - `dist/index.es.js` - ESM build
  - `dist/index.cjs.js` - CommonJS build
- CSS copied from `@stream-io/video-styling` during build
- TypeScript compilation for type definitions
- Source maps included
- Special handling for lazy-loaded chunks (e.g., `CallStatsLatencyChart`)

## Dependencies

**Core Dependencies:**

- `@stream-io/video-client` - Core WebRTC client (workspace dependency)
- `@stream-io/video-react-bindings` - React hooks layer (workspace dependency)
- `@stream-io/video-filters-web` - Video filters (background blur, effects)
- `chart.js` & `react-chartjs-2` - Call statistics charts
- `@floating-ui/react` - Tooltips, dropdowns positioning
- `clsx` - Conditional CSS class names

**Peer Dependencies:**

- React 17, 18, or 19
- React DOM 17, 18, or 19

## Important Notes & Best Practices

### When Adding New Components

1. **Follow existing component structure:**
   - Component file in its own directory under `src/components/`
   - Export from directory `index.ts`
   - Add to `src/components/index.ts` exports
   - Consider if it should be in `core/components/` (foundational) or `components/` (UI)

2. **Use existing hooks:**
   - Always use hooks from `@stream-io/video-react-bindings` for state
   - Use `useCallStateHooks()` factory pattern, not individual imports
   - Don't access `call.state` directly, use hooks
   - Leverage existing patterns from similar components

3. **Styling:**
   - Add styles to `@stream-io/video-styling` package (separate repo/package)
   - Use semantic class names matching component name (e.g., `str-video__component-name`)
   - Follow BEM-like naming convention: `str-video__component-name--modifier`
   - Use CSS variables for theming
   - Use `clsx` for conditional classes

4. **TypeScript:**
   - Export all public types
   - Use descriptive prop types with JSDoc comments
   - Extend base types when appropriate (e.g., `ComponentPropsWithoutRef<'div'>`)
   - Make override props optional with sensible defaults

### Common Patterns to Follow

#### Callback Refs Pattern

```typescript
// Good - allows both internal and external refs
const [internalRef, setInternalRef] = useState<HTMLElement | null>(null);

<div
  ref={(el) => {
    setInternalRef(el);
    externalRef?.(el); // Call user's ref too
  }}
/>
```

#### Memoizing Context Values

```typescript
// Always memoize context values to prevent unnecessary re-renders
const contextValue = useMemo(
  () => ({
    participant,
    videoElement,
    trackType,
  }),
  [participant, videoElement, trackType],
);
```

#### Handling Optional Props

```typescript
// Use default values in destructuring
const {
  ParticipantViewUI = DefaultParticipantViewUI,
  VideoPlaceholder = DefaultVideoPlaceholder,
  enabled = true,
} = props;
```

#### Component Type Checking

```typescript
// Use utility to check if prop is ComponentType vs ReactElement
import { isComponentType } from '../../../utilities';

{isComponentType(CustomUI) ? <CustomUI /> : CustomUI}
```

### Common Gotchas & Pitfalls

#### 1. Don't Access Observable Directly

```typescript
// ❌ WRONG - never do this in react-sdk
const participants = call.state.participants$.value;

// ✅ CORRECT - always use hooks
const { useParticipants } = useCallStateHooks();
const participants = useParticipants();
```

#### 2. Effect Dependencies with Hooks Factory

```typescript
// ❌ WRONG - useCallStateHooks() creates new object every render
const hooks = useCallStateHooks();
useEffect(() => {
  // This runs every render!
}, [hooks]);

// ✅ CORRECT - destructure at top level
const { useParticipants } = useCallStateHooks();
const participants = useParticipants();
useEffect(() => {
  // This only runs when participants change
}, [participants]);
```

#### 3. Video Element Binding Timing

```typescript
// ❌ WRONG - useEffect runs too late
useEffect(() => {
  call?.bindVideoElement(videoElement, sessionId, trackType);
}, [call, videoElement, sessionId, trackType]);

// ✅ CORRECT - useLayoutEffect runs before paint
useLayoutEffect(() => {
  if (!call || !videoElement) return;
  return call.bindVideoElement(videoElement, sessionId, trackType);
}, [call, videoElement, sessionId, trackType]);
```

#### 4. ParticipantViewUI Rendering

```typescript
// ❌ WRONG - doesn't handle ReactElement or null
<ParticipantViewUI />

// ✅ CORRECT - handles all override types
{isComponentType(ParticipantViewUI) ? (
  <ParticipantViewUI />
) : (
  ParticipantViewUI
)}
```

#### 5. Cleanup Functions

```typescript
// ❌ WRONG - no cleanup
useEffect(() => {
  call?.dynascaleManager.trackElementVisibility(element, sessionId, trackType);
}, [call, element, sessionId, trackType]);

// ✅ CORRECT - always cleanup observers/subscriptions
useEffect(() => {
  if (!element || !call) return;
  const cleanup = call.dynascaleManager.trackElementVisibility(
    element,
    sessionId,
    trackType,
  );
  return cleanup; // Unobserves on unmount
}, [call, element, sessionId, trackType]);
```

#### 6. Participant Identification

```typescript
// ❌ WRONG - userId is not unique per connection
participants.find((p) => p.userId === userId);

// ✅ CORRECT - sessionId is unique per connection
participants.find((p) => p.sessionId === sessionId);

// Note: Same user can join multiple times (different devices/tabs)
// Each connection gets a unique sessionId
```

#### 7. Layout Sort Preset Cleanup

```typescript
// ❌ WRONG - doesn't restore default sorting
useEffect(() => {
  if (!call) return;
  call.setSortParticipantsBy(customSortPreset);
}, [call]);

// ✅ CORRECT - restores default on unmount
useEffect(() => {
  if (!call) return;
  call.setSortParticipantsBy(customSortPreset);
  return () => {
    const callConfig = CallTypes.get(call.type);
    call.setSortParticipantsBy(
      callConfig.options.sortParticipantsBy || defaultSortPreset,
    );
  };
}, [call]);
```

#### 8. Device Selection State

```typescript
// ❌ WRONG - doesn't wait for devices to be available
usePersistedDevicePreferences();
// Immediately try to use devices - might not be ready!

// ✅ CORRECT - check if devices are available
const { useMicrophoneState } = useCallStateHooks();
const { devices } = useMicrophoneState();

if (devices.length === 0) {
  return <LoadingIndicator />;
}
```

#### 9. Mirror Local Video

```typescript
// ❌ WRONG - mirrors all participants
<Video participant={participant} mirror={true} />

// ✅ CORRECT - only mirror local participant's camera
<Video
  participant={participant}
  mirror={participant.isLocalParticipant && trackType === 'videoTrack'}
/>

// Note: Screen share should never be mirrored
```

#### 10. Audio Muting

```typescript
// ❌ WRONG - plays local participant audio (you hear yourself)
{hasAudio(participant) && (
  <Audio participant={participant} trackType="audioTrack" />
)}

// ✅ CORRECT - never play local participant audio
{!participant.isLocalParticipant && hasAudio(participant) && (
  <Audio participant={participant} trackType="audioTrack" />
)}
```

### When Modifying Layouts

- Layouts use `useFilteredParticipants` hook to filter and sort participants
- Participant sorting logic is in the client (`@stream-io/video-client`)
- Consider viewport visibility (Dynascale) when rendering large participant lists
- Test with different participant counts (1, 2, 5, 10, 50+)

### When Working with Media

- Video/audio elements are managed by `DynascaleManager` in the client
- Don't manually attach tracks to elements, use `Video` and `Audio` components
- Device selection changes propagate through the client
- Always check permissions before requesting media

### Generated Code

- CSS in `dist/` is copied from `@stream-io/video-styling`, don't edit manually
- TypeScript definitions in `dist/` are auto-generated from source

## Common Development Workflows

### Adding a New UI Component

1. Create component directory in `src/components/MyComponent/`
2. Create `MyComponent.tsx` with component implementation
3. Create `index.ts` that exports the component
4. Add export to `src/components/index.ts`
5. Add styles to `@stream-io/video-styling` package
6. Build and test in dogfood app: `yarn start:react:dogfood`

### Testing Changes Locally

1. **Build packages in watch mode:**

   ```bash
   # Terminal 1: Watch client
   yarn workspace @stream-io/video-client run start

   # Terminal 2: Watch bindings
   yarn workspace @stream-io/video-react-bindings run start

   # Terminal 3: Watch react-sdk
   yarn workspace @stream-io/video-react-sdk run start

   # Terminal 4: Run dogfood app
   yarn start:react:dogfood
   ```

2. **Or build all at once:**
   ```bash
   yarn build:react:deps
   yarn start:react:dogfood
   ```

### Debugging Common Issues

**Components not re-rendering:**

- Verify hooks are subscribing to correct observables
- Check if state updates are triggering in client (use debug logging)
- Ensure component is inside `StreamCall` context

**Styling not applied:**

- Check if styles exist in `@stream-io/video-styling` package
- Verify CSS is copied to `dist/` during build
- Check class names match between component and CSS

**Video/audio not showing:**

- Check permissions via `useCallPermissions` hook
- Verify tracks are published: `useLocalParticipant().publishedTracks`
- Check if participant is in `useParticipants()` array
- Verify `Video`/`Audio` components are receiving correct props

## Cross-Package Development

When making changes that affect multiple packages:

1. **Client changes** → rebuild bindings → rebuild react-sdk

   ```bash
   yarn build:client && yarn build:react:bindings && yarn build:react:sdk
   ```

2. **Bindings changes** → rebuild react-sdk

   ```bash
   yarn build:react:bindings && yarn build:react:sdk
   ```

3. **Styling changes** → rebuild styling → rebuild react-sdk

   ```bash
   yarn build:styling && yarn build:react:sdk
   ```

4. **Test in sample app:**
   ```bash
   yarn build:react:dogfood
   # or for development server:
   yarn start:react:dogfood
   ```

## Sample Applications

Sample apps are located in `sample-apps/react/` in the monorepo root:

- `react-dogfood/` - Internal testing application with all features
- Other sample apps demonstrating specific use cases

Use these to test changes in realistic scenarios.

## API Design Principles

From `AGENTS.md` at repo root:

- Semantic versioning
- Use `@deprecated` JSDoc with replacement guidance
- Avoid breaking changes; prefer additive evolution
- Consistent naming: `camelCase` for props/functions, `PascalCase` for components
- All public APIs must have TypeScript types

## Performance Considerations

- Use `React.memo` for components that render frequently (e.g., in large participant lists)
- Leverage `useCallback` and `useMemo` when profiling justifies
- Large participant lists use virtualization/pagination
- Video rendering is optimized by client's Dynascale system
- Monitor bundle size (check `dist/` after build)

## Accessibility

- All interactive components are keyboard accessible
- ARIA labels/roles provided where needed
- Color contrast follows WCAG AA standards
- Dynamic content changes announced appropriately
- Icons have accessible labels

## Documentation

When adding public APIs:

- Update component/hook JSDoc comments
- Update Stream's documentation site (separate repo)
- Update relevant sample apps
- Consider adding example code snippets

## Key File Locations & Quick Reference

### Core Entry Points

- `src/core/components/StreamVideo/StreamVideo.tsx` - Main provider (15 lines - simple wrapper)
- `src/core/components/StreamCall/StreamCall.tsx` - Call provider (13 lines - re-export)

### Core Components

- `src/core/components/ParticipantView/ParticipantView.tsx` - Single participant renderer (203 lines)
- `src/core/components/Video/Video.tsx` - Video element binding (223 lines)
- `src/core/components/Audio/Audio.tsx` - Audio element binding
- `src/core/components/CallLayout/SpeakerLayout.tsx` - Speaker-focused layout (331 lines)
- `src/core/components/CallLayout/PaginatedGridLayout.tsx` - Grid with pagination
- `src/core/components/CallLayout/LivestreamLayout.tsx` - Livestream-optimized layout
- `src/core/components/CallLayout/PipLayout.tsx` - Picture-in-picture layout

### Important Hooks

- `src/core/hooks/useTrackElementVisibility.ts` - Dynascale viewport tracking (30 lines)
- `src/hooks/usePersistedDevicePreferences.ts` - Device persistence (383 lines - complex!)
- `src/hooks/useDeviceList.tsx` - Device enumeration helper
- `src/hooks/useScrollPosition.ts` - Scroll position tracking for pagination

### Utilities & Helpers

- `src/utilities/filter.ts` - MongoDB-like filter system (132 lines)
- `src/utilities/applyElementToRef.ts` - Ref helper
- `src/utilities/isComponentType.ts` - Component type checking
- `src/core/components/CallLayout/hooks.ts` - Layout-specific hooks (filtering, sorting)

### UI Components

- `src/components/CallControls/CallControls.tsx` - Main control bar
- `src/components/CallControls/ToggleAudioButton.tsx` - Mic toggle (complex state)
- `src/components/CallControls/ToggleVideoButton.tsx` - Camera toggle (complex state)
- `src/components/DeviceSettings/DeviceSelector.tsx` - Device selection UI (170 lines)
- `src/components/BackgroundFilters/BackgroundFilters.tsx` - Video filters (386 lines)
- `src/components/CallParticipantsList/` - Participant list UI
- `src/components/CallStats/` - Call quality statistics display

### Key External Files (in bindings package)

- `@stream-io/video-react-bindings/src/hooks/callStateHooks.ts` - All state hooks
- `@stream-io/video-react-bindings/src/contexts/StreamVideoContext.tsx` - Client context
- `@stream-io/video-react-bindings/src/contexts/CallContext.tsx` - Call context
- `@stream-io/video-react-bindings/src/hooks/useObservableValue.ts` - Observable bridge

### Configuration & Build

- `rollup.config.mjs` - Build configuration (60 lines)
- `index.ts` - Package entry point
- `src/translations/en.json` - English translations
- `package.json` - Dependencies and scripts

## Quick Code Navigation Tips

### Finding Hook Usage Patterns

1. Look at `SpeakerLayout.tsx` or `ParticipantView.tsx` for typical hook usage
2. Check `useCallStateHooks()` return type for available hooks
3. Search for `useCallStateHooks` in codebase to see patterns

### Understanding Component Customization

1. Check prop types for `ParticipantViewUI`, `VideoPlaceholder` patterns
2. Look at `DefaultParticipantViewUI` to see what context is available
3. Review `SpeakerLayout` props for typical customization options

### Tracing Data Flow

1. **State change:** Client (`CallState`) → Observable → Binding Hook → React Component
2. **Action:** Component → Binding Hook → Client Method → SFU/Backend
3. **Media:** Client (`bindVideoElement`) → DynascaleManager → MediaStreamTrack → HTMLVideoElement

### Finding Examples

1. **Simple component:** Check `Button.tsx` or `Icon.tsx`
2. **Complex component:** Check `ParticipantView.tsx` or `SpeakerLayout.tsx`
3. **Hook pattern:** Check `useTrackElementVisibility.ts` or `usePersistedDevicePreferences.ts`
4. **Integration:** Check dogfood sample app at `sample-apps/react/react-dogfood/`

## Architecture Decision Records

### Why Three Layers?

- **Separation of concerns:** WebRTC logic separate from React, UI separate from state
- **Platform reuse:** Client works in React Native with different UI layer
- **Testing:** Can test client logic without React, test React hooks without UI

### Why useCallStateHooks Factory?

- **Performance:** Avoid importing 50+ individual hooks
- **Discoverability:** Type autocomplete shows all available hooks
- **Consistency:** All hooks share same context, no confusion about source

### Why Callback Refs Everywhere?

- **Flexibility:** Allows both internal state management and external access
- **Composition:** Multiple components can reference same element
- **Cleanup:** Easy to manage lifecycle of DOM observations

### Why Not Direct Track Assignment?

- **Dynascale:** Client needs to control which tracks play based on viewport
- **Track Lifecycle:** Client handles track replacement, muting, disposal
- **Audio Routing:** Client uses AudioContext for advanced audio features
- **Abstraction:** Components don't need WebRTC API knowledge

### Why MongoDB-Like Filters?

- **Familiarity:** Developers already know this query syntax
- **Composability:** Complex filters via $and/$or without code changes
- **Type Safety:** Filter types match participant types
- **Extensibility:** Easy to add new operators

## Related Documentation

- Client architecture: `../client/CLAUDE.md`
- Monorepo practices: `../../AGENTS.md` (AI agent guidance)
- Contributing guide: `../../CONTRIBUTING.md`
- Public docs: https://getstream.io/video/docs/react/
