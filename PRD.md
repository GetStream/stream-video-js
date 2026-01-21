# Picture in Picture iOS improvements

## Introduction

### Background

Picture in Picture (PiP) is an iOS feature that allows video content to continue playing in a small floating window while users interact with other apps. For video calling applications, this is essential for maintaining call visibility when users need to multitask—checking messages, browsing, or using other apps during an active call.

The Stream Video React Native SDK currently includes a PiP implementation for iOS, but it was based on an earlier version of the upstream `stream-video-swift` library (PR #146). Since then, the Swift library has undergone significant improvements (PR #258 and subsequent updates) that address reliability issues, improve performance, and add new features.

The upstream codebase is present at `~/Downloads/stream-video-swift-develop`. Very important: when fetching code for the `stream-video-swift` lib look at the local folder only.

### Problem Statement

The current React Native SDK PiP implementation has several limitations:

1. **Reliability issues**: Video may freeze or show blank frames when transitioning to PiP mode
2. **Inconsistent participant selection**: The logic for selecting which participant to display doesn't always match user expectations
3. **Resource cleanup problems**: PiP resources may not be properly released when calls end, potentially causing issues with subsequent calls
4. **Feature drift**: The React Native implementation lacks improvements and UI features that have been added to the upstream Swift library

### Scope

This project focuses exclusively on the iOS native implementation within `packages/react-native-sdk/ios`. The goal is to port the improved PiP implementation from `stream-video-swift` while maintaining full backward compatibility with the existing React Native JavaScript API.

## Implementation

### Current State

The current implementation is based on `stream-video-swift` PR: https://github.com/GetStream/stream-video-swift/pull/146

### Target State

The new implementation should be based on:

1. **PR #258**: https://github.com/GetStream/stream-video-swift/pull/258
2. **Latest develop branch files**: All subsequent improvements made to the PiP files in the `stream-video-swift` library

### Source Files Location

**IMPORTANT**: The authoritative source files are located at:

**https://github.com/GetStream/stream-video-swift/tree/develop/Sources/StreamVideoSwiftUI/Utils/PictureInPicture**

All Swift files from this directory should be copied and used to **replace** the older copied files in the React Native SDK. Where possible, use the files exactly as-is to minimize drift and simplify future updates.

### Porting Strategy

| Source (stream-video-swift)                                 | Target (react-native-sdk)                                                | Action                                        |
| ----------------------------------------------------------- | ------------------------------------------------------------------------ | --------------------------------------------- |
| `Sources/StreamVideoSwiftUI/Utils/PictureInPicture/*.swift` | `packages/react-native-sdk/ios/StreamVideoReactNative/PictureInPicture/` | Replace existing files with upstream versions |
| Any new files in upstream PiP directory                     | Same target directory                                                    | Copy new files                                |
| Files with Stream-specific dependencies                     | Adapt as needed                                                          | Modify imports/dependencies for RN context    |

### Adaptation Guidelines

When copying files from upstream:

1. **Copy exactly when possible**: If a file has no dependencies on other Stream Swift SDK components, copy it verbatim
2. **Adapt imports**: Replace `import StreamVideo` or `import StreamVideoSwiftUI` with appropriate local imports
3. **Remove unused dependencies**: If upstream files reference components not needed for RN SDK (e.g., SwiftUI views), remove those references
4. **Preserve logic**: The core PiP logic, frame processing, and lifecycle management should remain unchanged
5. **Maintain naming**: Keep class/struct/protocol names identical to upstream for easier future syncs

### React Native Bridge

The React Native wrapper methods should **not** be changed. The bridge layer (`RTCViewPip.swift`, `RTCViewPipViewManager.swift`) will be updated to use the new ported components while maintaining the same public interface.

## Goals

### Product / UX goals

- **Reliable iOS PiP**: when the app backgrounds during a call, Picture in Picture continues rendering video smoothly (no freezes/blank view).
- **Correct participant selection**: PiP shows the dominant speaker and **prefers a remote participant** when available.
- **Predictable stop behavior**: PiP stops when the call ends / the user leaves, and never shows stale video.
- **UI parity with upstream**: any UI controls or overlays added for PiP in the `stream-video-swift` library must also be ported to the React Native SDK.

### Engineering goals

- **Align with upstream**: base the iOS implementation on `stream-video-swift` PR `#258` and later upstream improvements to minimize drift.
- **Performance discipline**: PiP rendering work is bounded (resize/downsample/skip frames as needed) and does not regress CPU/battery.
- **No JS API changes**: the React Native wrapper methods/public surface remain unchanged (as stated above).

## User Stories

### Overview

| ID     | Title                          | Priority      | Status      |
| ------ | ------------------------------ | ------------- | ----------- |
| US-001 | Auto-start PiP on background   | P0 (Critical) | ✅ Complete |
| US-002 | Correct participant rendering  | P0 (Critical) | ✅ Complete |
| US-003 | Stable window sizing           | P1 (High)     | ✅ Complete |
| US-004 | Cleanup on call end            | P0 (Critical) | ✅ Complete |
| US-005 | Participant avatar placeholder | P1 (High)     | ✅ Complete |
| US-006 | Reconnection view              | P1 (High)     | ✅ Complete |
| US-007 | Screen sharing view            | P2 (Medium)   | ✅ Complete |
| US-008 | Content view system            | P1 (High)     | ✅ Complete |
| US-009 | Participant info overlay       | P3 (Low)      | ✅ Complete |
| US-010 | Video rendering pipeline       | P1 (High)     | ✅ Complete |
| US-011 | Controller infrastructure      | P0 (Critical) | ✅ Complete |

### Dependency Graph

```
                    ┌─────────────┐
                    │   US-011    │  Controller & Adapter Infrastructure
                    │ (Foundation)│
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           ▼               ▼               ▼
    ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
    │   US-010    │ │  US-001 to  │ │   US-008    │
    │  Rendering  │ │   US-004    │ │Content View │
    │  Pipeline   │ │(Core Behavior)│  System    │
    └──────┬──────┘ └─────────────┘ └──────┬──────┘
           │                               │
           │         ┌─────────────────────┼─────────────────────┐
           │         │                     │                     │
           ▼         ▼                     ▼                     ▼
    ┌─────────────────────┐         ┌─────────────┐       ┌─────────────┐
    │      US-005         │         │   US-006    │       │   US-007    │
    │  Avatar Placeholder │         │ Reconnection│       │Screen Share │
    └─────────────────────┘         └─────────────┘       └──────┬──────┘
                                                                 │
                                                                 ▼
                                                          ┌─────────────┐
                                                          │   US-009    │
                                                          │  Overlays   │
                                                          └─────────────┘
```

### Recommended Implementation Order

1. **Phase 1 (Foundation):** US-011 → US-010
2. **Phase 2 (Core Behavior - already complete):** US-001, US-002, US-003, US-004
3. **Phase 3 (Content System):** US-008
4. **Phase 4 (UI Features):** US-005, US-006, US-007 (can be parallel)
5. **Phase 5 (Polish):** US-009

---

### US-001: Auto-start PiP on background (when enabled)

**Priority:** P0 (Critical)

**Description:** As a user, when I background the app during a call, PiP should start automatically (if supported) so I can keep watching while using other apps.

**Acceptance Criteria:**

- [x] On iOS devices that support PiP for video calls (iOS 15+ for our PiP view controller), backgrounding the app starts PiP automatically when PiP is enabled.
- [x] If PiP is disabled via existing controls, PiP does **not** start automatically.
- [x] JS is notified of PiP state via the existing native event/callback so `useIsInPiPMode()` is correct.

**Technical Notes:**

- Relies on `AVPictureInPictureController.canStartPictureInPictureAutomaticallyFromInline` property
- Must handle the `UIApplication.willResignActiveNotification` lifecycle event
- The `RTCViewPip` component must be mounted and configured before backgrounding

---

### US-002: PiP renders the correct participant and doesn't go "blank"

**Priority:** P0 (Critical)

**Description:** As a user, PiP should show an actively-updating video feed and select the most relevant participant (dominant speaker, preferring remote).

**Acceptance Criteria:**

- [x] PiP renders the dominant speaker; if the dominant speaker is local and a remote participant exists, PiP prefers the remote participant.
- [x] When the underlying WebRTC track is replaced/changes, PiP continues rendering without showing a blank local track.
- [x] When screen share is active, PiP can render the screen share track (consistent with current JS selection logic).

**Technical Notes:**

- Participant selection logic is handled on the JS side; native receives the selected track
- Track changes must be handled gracefully by the `StreamPictureInPictureTrackStateAdapter`
- The sample buffer display layer must be updated atomically when tracks change

---

### US-003: PiP window sizing is stable and configurable

**Priority:** P1 (High)

**Description:** As a developer, PiP should have a safe default size and optionally adapt to the incoming track dimensions without triggering iOS errors.

**Acceptance Criteria:**

- [x] The PiP content view controller never uses `preferredContentSize = .zero` (avoids iOS `PGPegasus code:-1003`).
- [x] When JS supplies track dimensions via the existing native command, iOS PiP updates preferred size accordingly (with sane bounds).
- [x] Adaptive sizing updates when track size changes, without flicker.

**Technical Notes:**

- Default size should be a sensible fallback (e.g., 360x640 for portrait, 640x360 for landscape)
- Size bounds should respect iOS PiP constraints (minimum ~100pt, maximum ~400pt width typically)
- Use `StreamSizingPolicy` to manage fixed vs. adaptive sizing modes

---

### US-004: PiP stops and cleans up on call end / leave

**Priority:** P0 (Critical)

**Description:** As a user, PiP should stop when the call is no longer active so I don't see stale content or waste battery.

**Acceptance Criteria:**

- [x] When the call ends (`call.ended`) or the user leaves (calling state becomes `LEFT`), PiP is stopped via the existing native call-closed path.
- [x] Native resources are released: PiP controller content source cleared, delegates removed, renderers detached, and timers/subscriptions cancelled.
- [x] A subsequent call can start PiP again without requiring an app restart.

**Technical Notes:**

- The `onCallClosed` native command triggers full cleanup
- Must nil out the content source before releasing the controller to avoid crashes
- All Combine subscriptions and observers must be cancelled
- The cleanup sequence must be idempotent (safe to call multiple times)

---

### US-005: Participant avatar placeholder when video is disabled

**Priority:** P1 (High)

**Description:** As a user, when the displayed participant has their camera off, I should see their profile picture/avatar in the PiP window instead of a blank or frozen frame.

**Acceptance Criteria:**

- [x] When the participant's video track is disabled/nil, PiP displays their profile picture or a default avatar placeholder.
- [x] The avatar is centered and appropriately sized within the PiP window.
- [x] When video is re-enabled, PiP smoothly transitions back to the live video feed.
- [x] If no profile picture is available, a default placeholder (initials or generic avatar) is shown.

**Technical Notes:**

- Created `PictureInPictureAvatarView.swift` as a UIKit-based avatar view
- Avatar view supports: profile image from URL, initials fallback, generic person icon fallback
- Avatar/profile picture URL passed from JS via view properties (`participantName`, `participantImageURL`, `isVideoEnabled`)
- Image loading is async with URLSession and automatic cleanup

**Implementation Notes:**

- `PictureInPictureAvatarView.swift` - UIView displaying avatar with profile image, initials, or default icon
- `StreamPictureInPictureVideoRenderer.swift` - Contains avatar view, shows/hides based on `isVideoEnabled`
- `StreamAVPictureInPictureVideoCallViewController.swift` - Forwards avatar properties to renderer
- `StreamPictureInPictureController.swift` - Exposes avatar properties from bridge
- `RTCViewPip.swift` - Receives properties from React Native bridge
- `RTCViewPipManager.mm` - Exports `participantName`, `participantImageURL`, `isVideoEnabled` properties
- `RTCViewPipNative.tsx` - TypeScript types for new properties
- `RTCViewPipIOS.tsx` - Passes participant info (`name`, `image`, video enabled status) to native

**Dependencies:**

- Depends on US-001 through US-004 being complete

---

### US-006: Reconnection view during connection recovery

**Priority:** P1 (High)

**Description:** As a user, when the call connection is being recovered (e.g., network switch, temporary disconnection), I should see a clear reconnection indicator in PiP instead of frozen/stale video.

**Acceptance Criteria:**

- [x] When connection state indicates reconnecting, PiP displays a reconnection view with appropriate visual indicator (spinner, message).
- [x] The reconnection view matches the upstream `stream-video-swift` styling.
- [x] When connection is restored, PiP smoothly transitions back to the live video feed.
- [x] If reconnection fails and call ends, PiP stops gracefully (ties into US-004).

**Technical Notes:**

- Port `PictureInPictureReconnectionView.swift` from upstream
- Connection state must be communicated from JS to native (may need new event or command)
- Consider timeout behavior if reconnection takes too long

**Upstream Files:**

- `PictureInPictureReconnectionView.swift`

**Dependencies:**

- Depends on US-001 through US-004 being complete

---

### US-007: Screen sharing view in PiP

**Priority:** P2 (Medium)

**Description:** As a user, when screen sharing is active, the PiP window should render the screen share content appropriately with any specific UI treatments from upstream.

**Acceptance Criteria:**

- [x] Screen share content renders correctly in PiP with appropriate aspect ratio handling.
- [x] Any screen-share-specific UI elements from upstream (e.g., indicator that it's a screen share) are ported.
- [x] Transitions between screen share and camera video are smooth.
- [x] Screen share from both local and remote participants is supported.

**Technical Notes:**

- Port `PictureInPictureScreenSharingView.swift` from upstream
- Screen share tracks may have different dimensions than camera tracks; sizing policy must handle this
- JS already handles track selection for screen share; native just needs to render appropriately

**Upstream Files:**

- `PictureInPictureScreenSharingView.swift`

**Dependencies:**

- Depends on US-001 through US-004 being complete

---

### US-008: PiP content view system and state management

**Priority:** P1 (High)

**Description:** As a developer, the PiP implementation should use the upstream content view architecture and state management for consistent behavior and easier maintenance.

**Acceptance Criteria:**

- [x] Port the `PictureInPictureContentView` system from upstream for unified content rendering.
- [x] Port `PictureInPictureContent` data model for representing PiP content state.
- [x] Port `PictureInPictureStore` for centralized state management.
- [x] Port `PictureInPictureContentProvider` for content supply logic.
- [x] The content system correctly switches between video, avatar, reconnection, and screen share views based on state.

**Technical Notes:**

- This is foundational for US-005, US-006, and US-007; may need to be implemented first
- State transitions must be thread-safe
- Consider how React Native bridge interacts with the store (updates from JS → store → view)

**Upstream Files:**

- `PictureInPictureContentView.swift`
- `PictureInPictureContent.swift`
- `PictureInPictureContentProvider.swift`
- `PictureInPictureStore.swift`

**Implementation Notes:**

- `PictureInPictureContent.swift` - Data model representing PiP content states (inactive, video, avatar, screenSharing, reconnecting)
- `PictureInPictureContentState.swift` - Centralized state manager (adapted from upstream `PictureInPictureStore`)
  - Uses Combine for reactive state updates
  - Thread-safe with serial DispatchQueue
  - Automatic content type determination based on state priority
- `StreamPictureInPictureVideoRenderer.swift` - Acts as the unified content view
  - Supports both legacy individual properties and new `content` enum
  - Can subscribe to `PictureInPictureContentState` for reactive updates
  - Manages overlay visibility based on content state
- `StreamPictureInPictureController.swift` - Integrates content state system
  - Updates both contentState and contentViewController for backward compatibility
  - Logs content state transitions for debugging
  - Resets content state on cleanup
- Content priority order: reconnecting > avatar (video disabled) > screen sharing > video > inactive

**Dependencies:**

- Depends on US-001 through US-004 being complete
- US-005, US-006, US-007 depend on this story

---

### US-009: Participant information overlay

**Priority:** P3 (Low)

**Description:** As a user, I may see participant information (name, mute status) overlaid on the PiP window if this feature exists in upstream.

**Acceptance Criteria:**

- [x] If upstream includes name labels in PiP, port them with matching styling.
- [x] If upstream includes mute/audio indicators in PiP, port them with matching styling.
- [x] Overlays update correctly when participant state changes (mute/unmute, name changes).
- [x] Overlays do not obstruct critical video content.

**Technical Notes:**

- Investigate upstream to confirm which overlays exist (may be minimal for PiP)
- Overlay data must be passed from JS; may require extending native commands
- Keep overlays lightweight to minimize battery impact
- Use `PictureInPictureParticipantModifier` patterns from upstream

**Upstream Files:**

- `PictureInPictureParticipantModifier.swift`
- Any overlay-related components in `PictureInPictureContentView.swift`

**Dependencies:**

- Depends on US-008 (content view system)

---

### US-010: Video rendering pipeline improvements

**Priority:** P1 (High)

**Description:** As a developer, the video rendering pipeline should use the latest upstream components for buffer transformation, YUV conversion, and frame rendering.

**Acceptance Criteria:**

- [x] Port `PictureInPictureVideoRenderer.swift` for improved frame rendering logic.
- [x] Port `PictureInPictureBufferTransformer.swift` for efficient buffer format conversion.
- [x] Port `StreamRTCYUVBuffer.swift` for YUV pixel buffer management.
- [x] Port `StreamYUVToARGBConversion.swift` for color space conversion.
- [x] Port `YpCbCrPixelRange+Default.swift` for color range configuration.
- [x] Video rendering performance is equal to or better than current implementation.

**Technical Notes:**

- These are core rendering components that other features depend on
- Ensure hardware acceleration is utilized where possible
- Profile performance on older devices (iPhone 8/X class)

**Upstream Files:**

- `PictureInPictureVideoRenderer.swift`
- `PictureInPictureVideoRendererView.swift`
- `PictureInPictureBufferTransformer.swift`
- `StreamRTCYUVBuffer.swift`
- `StreamYUVToARGBConversion.swift`
- `YpCbCrPixelRange+Default.swift`

**Implementation Notes:**

- `StreamPictureInPictureVideoRenderer.swift` - UIKit-based video renderer with frame skipping optimization, buffer transformation, and multi-overlay support (avatar, reconnection, screen share, participant info)
- `StreamBufferTransformer.swift` - Transforms RTCI420Buffer to CVPixelBuffer with aspect-ratio-preserving resize
- `StreamRTCYUVBuffer.swift` - Handles YUV to ARGB conversion using Accelerate framework (vImage)
- `StreamYUVToARGBConversion.swift` - Configurable YUV to ARGB conversion supporting ITU-R BT.601 and BT.709 standards
- `YpCbCrPixelRange+Default.swift` - Default pixel range configuration for color space conversion
- `SampleBufferVideoCallView.swift` - UIView wrapper for AVSampleBufferDisplayLayer with iOS 17+ support for AVSampleBufferVideoRenderer
- `StreamPixelBufferPool.swift` - CVPixelBufferPool management for efficient memory reuse
- `StreamPixelBufferRepository.swift` - Repository managing multiple pixel buffer pools with thread-safe access
- Performance optimizations: frame skipping based on size ratios, resize threshold of 1x, hardware-accelerated vImage conversions

**Dependencies:**

- Core dependency for all other PiP user stories

---

### US-011: PiP controller and adapter infrastructure

**Priority:** P0 (Critical)

**Description:** As a developer, the core PiP controller and adapter infrastructure should be updated to match the upstream architecture.

**Acceptance Criteria:**

- [x] Port `PictureInPictureController.swift` as the main orchestrator.
- [x] Port `StreamPictureInPictureAdapter.swift` for bridging Stream's video system.
- [x] Port `StreamPictureInPictureControllerProtocol.swift` for interface contracts.
- [x] Port `PictureInPictureTrackStateAdapter.swift` for track state synchronization.
- [x] Port `PictureInPictureEnforcedStopAdapter.swift` for forced termination handling.
- [x] Port `PictureInPictureDelegateProxy.swift` for event delegation.
- [x] Port `PictureInPictureVideoCallViewController.swift` for UIKit integration.
- [x] Port `PictureInPictureViewFactory.swift` for view creation.
- [x] Port `PictureInPictureSourceView.swift` for video source rendering.

**Implementation Notes:**

- Ported applicable infrastructure components from upstream `stream-video-swift`
- `PictureInPictureDelegateProxy.swift` - Wraps AVPictureInPictureControllerDelegate with Combine publisher
- `StreamPictureInPictureControllerProtocol.swift` - Protocol abstraction for PiP controller
- `PictureInPictureEnforcedStopAdapter.swift` - Enforces PiP stop when app returns to foreground
- Updated `StreamPictureInPictureController.swift` to use new delegate proxy and enforced stop adapter
- SwiftUI-specific files (ViewFactory, SourceView, Adapter with dependency injection) adapted for UIKit-based RN SDK

**Technical Notes:**

- This is the foundational infrastructure that everything else builds on
- Adapt imports and dependencies for React Native context
- Ensure the React Native bridge (`RTCViewPip`, `RTCViewPipViewManager`) integrates cleanly with new controllers
- The protocol-based design allows for testing and flexibility

**Upstream Files:**

- `PictureInPictureController.swift`
- `StreamPictureInPictureAdapter.swift`
- `StreamPictureInPictureControllerProtocol.swift`
- `PictureInPictureTrackStateAdapter.swift`
- `PictureInPictureEnforcedStopAdapter.swift`
- `PictureInPictureDelegateProxy.swift`
- `PictureInPictureVideoCallViewController.swift`
- `PictureInPictureViewFactory.swift`
- `PictureInPictureSourceView.swift`

**Dependencies:**

- No dependencies; this is the foundation
- US-001 through US-004 and all other stories depend on this

## Non-Goals

### Explicitly Out of Scope

- **No Android changes**: Android PiP uses a completely different system API (`PictureInPictureParams`, Activity-based) and has its own lifecycle behavior. Android improvements, if needed, should be handled in a separate project.

- **No public JS API changes**: The React Native wrapper methods (`RTCViewPip` component props, `useIsInPiPMode()` hook, native commands) remain unchanged. This ensures backward compatibility for existing integrations. Any new functionality must work within the existing API surface or be opt-in via existing configuration patterns.

- **No iOS < 15 support for video call PiP**: The `AVPictureInPictureVideoCallViewController` API requires iOS 15+. Devices running iOS 14 and earlier will not receive PiP functionality for video calls. This is an Apple platform limitation, not a design choice. The SDK should gracefully degrade (PiP simply won't activate) on older iOS versions.

- **No new PiP UI controls beyond upstream**: We port what exists in `stream-video-swift`, not invent new UI. If stakeholders want additional PiP controls (e.g., mute button, end call button), those should first be implemented in the upstream Swift library, then ported here. This maintains consistency across Stream's native and React Native SDKs.

- **No CallKit integration changes**: While PiP and CallKit both relate to call handling, any changes to CallKit behavior (audio routing, call state management) are separate concerns and out of scope.

- **No JS-side rendering changes**: The JavaScript components that select which participant/track to display in PiP remain unchanged. This project only improves how the native layer renders and manages the PiP window once it receives the track.

### Future Considerations (Not in This Release)

- **Customizable PiP UI via JS**: Allowing developers to customize PiP overlays from JavaScript could be valuable but adds significant complexity. Consider for a future release.
- **PiP for audio-only calls**: Currently PiP is video-focused. Audio-only call PiP (showing participant avatars) is a potential future enhancement.
- **tvOS/macOS PiP**: Stream SDKs may expand to other Apple platforms; PiP implementations there would be separate efforts.

## Technical Considerations

### Architecture Overview

The PiP implementation follows a layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                    React Native JS Layer                     │
│  (RTCViewPip component, useIsInPiPMode hook, track selection)│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   React Native Bridge                        │
│  (RTCViewPipViewManager, native commands, event emitters)    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PiP Controller Layer                       │
│  (StreamPictureInPictureController - manages AVPiPController)│
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Rendering Layer                            │
│  (StreamPictureInPictureVideoCallViewController,             │
│   AVSampleBufferDisplayLayer, frame processing)              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   WebRTC Integration                         │
│  (RTCVideoTrack, RTCVideoRenderer protocol, frame capture)   │
└─────────────────────────────────────────────────────────────┘
```

### Key Components (Ported from stream-video-swift)

| Component                                       | Purpose                                                                                           |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `StreamPictureInPictureController`              | Main coordinator; manages `AVPictureInPictureController` lifecycle, handles start/stop, delegates |
| `StreamPictureInPictureVideoCallViewController` | Subclass of `AVPictureInPictureVideoCallViewController`; hosts the sample buffer display layer    |
| `StreamPictureInPictureTrackStateAdapter`       | Bridges WebRTC track to the rendering layer; handles track changes gracefully                     |
| `StreamAVSampleBufferVideoRenderer`             | Converts WebRTC `RTCVideoFrame` to `CMSampleBuffer` and enqueues to display layer                 |
| `StreamSizingPolicy`                            | Manages PiP window sizing (fixed vs. adaptive modes)                                              |
| `StreamBufferTransformer`                       | Handles frame resizing/downsampling for performance                                               |

### Native iOS Implementation Details

**AVPictureInPictureController Setup (iOS 15+):**

```swift
let contentSource = AVPictureInPictureController.ContentSource(
    activeVideoCallSourceView: sourceView,
    contentViewController: pipViewController
)
pipController = AVPictureInPictureController(contentSource: contentSource)
pipController.canStartPictureInPictureAutomaticallyFromInline = true
pipController.delegate = self
```

**Sample Buffer Rendering Pipeline:**

1. WebRTC delivers `RTCVideoFrame` via `RTCVideoRenderer` protocol
2. `StreamAVSampleBufferVideoRenderer` converts pixel buffer to `CMSampleBuffer`
3. Frame is optionally resized/downsampled by `StreamBufferTransformer`
4. `CMSampleBuffer` is enqueued to `AVSampleBufferDisplayLayer`
5. Display layer renders in the PiP window

**Window Sizing Policy:**

- **Fixed mode**: Uses a constant `preferredContentSize` (e.g., 360x640)
- **Adaptive mode**: Updates `preferredContentSize` based on incoming track dimensions
- **Constraints**: Never use `.zero`; respect iOS min/max bounds; maintain aspect ratio

### JS ↔ Native Integration

**Existing Native Commands (unchanged):**
| Command | Parameters | Purpose |
|---------|------------|---------|
| `setStreamURL` | `streamURL: String?` | Sets the WebRTC track/stream to render |
| `setPreferredContentSize` | `width: Double, height: Double` | Updates PiP window size |
| `onCallClosed` | None | Triggers cleanup when call ends |

**Existing Events (unchanged):**
| Event | Payload | Purpose |
|-------|---------|---------|
| `onPiPChange` | `{ active: Boolean }` | Notifies JS of PiP state changes |

### Performance Optimizations

1. **Frame skipping**: When incoming frame dimensions significantly exceed PiP window size, skip frames to reduce processing load
2. **Lazy renderer attachment**: Only attach the renderer to the WebRTC track when PiP is actually visible (not just enabled)
3. **Efficient resizing**: Use hardware-accelerated `vImage` or `Accelerate` framework for frame resizing
4. **Memory management**: Reuse `CMSampleBuffer` timing info; avoid unnecessary allocations in the render loop
5. **Main thread discipline**: UI updates on main thread; frame processing on background queue

### File Structure

```
packages/react-native-sdk/ios/
├── StreamVideoReactNative/
│   ├── PictureInPicture/
│   │   ├── StreamPictureInPictureController.swift
│   │   ├── StreamPictureInPictureVideoCallViewController.swift
│   │   ├── StreamPictureInPictureTrackStateAdapter.swift
│   │   ├── StreamAVSampleBufferVideoRenderer.swift
│   │   ├── StreamBufferTransformer.swift
│   │   ├── StreamSizingPolicy.swift
│   │   └── Extensions/
│   │       ├── CMSampleBuffer+Extensions.swift
│   │       └── CVPixelBuffer+Extensions.swift
│   ├── RTCViewPip.swift              (React Native view)
│   ├── RTCViewPipViewManager.swift   (React Native bridge)
│   └── RTCViewPipViewManager.m       (Objective-C module)
```

### Error Handling

| Error Scenario                                | Handling                                                                            |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| PiP not supported (iOS < 15)                  | Gracefully degrade; `canStartPictureInPictureAutomaticallyFromInline` returns false |
| `preferredContentSize = .zero`                | Always use default fallback size (360x640)                                          |
| Track becomes nil unexpectedly                | Detach renderer; show placeholder or stop PiP                                       |
| `AVPictureInPictureController` fails to start | Log error; emit `onPiPChange(false)` to JS                                          |
| App terminated while in PiP                   | iOS handles this; no special handling needed                                        |

### Testing Strategy

If iOS Dogfood app builds. Test passes. Thats it.

iOS dogfood app is at the directory `sample-apps/react-native/dogfood`

1.Run `yarn build:react-native:deps` to build the JS dependencies. 2. Move to the directory. 3. Run `yarnpod` bash alias to install the pod files 4. `yarn ios` to build and run the iOS app, or run a direct build for xcode-cli if thats easier, no need to run it.

**Manual Test Matrix:**

| Scenario                  | iOS 15 | iOS 16 | iOS 17 | iOS 18 |
| ------------------------- | ------ | ------ | ------ | ------ |
| Background → PiP starts   | ✓      | ✓      | ✓      | ✓      |
| Foreground → PiP stops    | ✓      | ✓      | ✓      | ✓      |
| Dominant speaker changes  | ✓      | ✓      | ✓      | ✓      |
| Participant join/leave    | ✓      | ✓      | ✓      | ✓      |
| Camera toggle (on/off)    | ✓      | ✓      | ✓      | ✓      |
| Screen share start/stop   | ✓      | ✓      | ✓      | ✓      |
| End call while in PiP     | ✓      | ✓      | ✓      | ✓      |
| Leave call while in PiP   | ✓      | ✓      | ✓      | ✓      |
| Re-enter PiP in next call | ✓      | ✓      | ✓      | ✓      |
| PiP disabled via controls | ✓      | ✓      | ✓      | ✓      |
| Low memory conditions     | ✓      | ✓      | ✓      | ✓      |

## Dependencies

### Internal Dependencies

| Dependency                                       | Type        | Description                                                       |
| ------------------------------------------------ | ----------- | ----------------------------------------------------------------- |
| `stream-video-swift` repository                  | Source      | Reference implementation for PiP; source of Swift files to port   |
| `react-native-webrtc`                            | Runtime     | Provides `RTCVideoTrack`, `RTCVideoFrame`, and renderer protocols |
| Existing `RTCViewPip` JS component               | Integration | React Native component that mounts the native PiP view            |
| Existing native bridge (`RTCViewPipViewManager`) | Integration | Handles JS ↔ Native communication                                |

### External Dependencies

| Dependency                       | Version | Description                                                  |
| -------------------------------- | ------- | ------------------------------------------------------------ |
| iOS SDK                          | 15.0+   | Required for `AVPictureInPictureVideoCallViewController` API |
| AVKit framework                  | System  | Provides `AVPictureInPictureController` and related classes  |
| AVFoundation framework           | System  | Provides `AVSampleBufferDisplayLayer`, `CMSampleBuffer`      |
| CoreMedia framework              | System  | Provides timing and buffer management utilities              |
| WebRTC (via react-native-webrtc) | Latest  | Video track and frame rendering infrastructure               |

### Build Requirements

- Xcode 14.0+ (for iOS 15+ SDK support)
- Swift 5.7+
- CocoaPods (depending on project setup)

## Risks and Mitigations

### Technical Risks

| Risk                                                      | Likelihood | Impact | Mitigation                                                                             |
| --------------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------- |
| **API differences between stream-video-swift and RN SDK** | Medium     | Medium | Carefully adapt ported code; maintain abstraction layer at the bridge                  |
| **Memory leaks in frame processing pipeline**             | Medium     | High   | Use Instruments to profile; ensure all buffers are released; test with memory pressure |
| **Race conditions during track switching**                | Medium     | High   | Use serial queues for state mutations; test rapid track changes                        |
| **iOS version-specific bugs**                             | Low        | Medium | Test on all supported iOS versions; add version-specific workarounds if needed         |
| **Performance regression on older devices**               | Medium     | Medium | Profile on iPhone 8/X class devices; implement frame skipping if needed                |

### Integration Risks

| Risk                                    | Likelihood | Impact   | Mitigation                                                                    |
| --------------------------------------- | ---------- | -------- | ----------------------------------------------------------------------------- |
| **Breaking existing integrations**      | Low        | Critical | No public API changes; extensive regression testing                           |
| **Conflicts with other native modules** | Low        | Medium   | Ensure PiP lifecycle doesn't interfere with CallKit or other video components |
| **React Native version compatibility**  | Low        | Medium   | Test with RN 0.71+ (current supported versions)                               |

### Schedule Risks

| Risk                                                 | Likelihood | Impact | Mitigation                                                    |
| ---------------------------------------------------- | ---------- | ------ | ------------------------------------------------------------- |
| **Upstream changes during development**              | Medium     | Low    | Monitor `stream-video-swift` for changes; sync before release |
| **Hidden complexity in UI overlay porting (US-005)** | Medium     | Medium | Spike on overlay implementation early; descope if needed      |

## Success Metrics

### Functional Metrics

| Metric                             | Target                            | Measurement                           |
| ---------------------------------- | --------------------------------- | ------------------------------------- |
| PiP activation success rate        | > 99% on supported devices        | Manual testing; crash reports         |
| Video continuity (no blank frames) | 100% during normal operation      | Manual testing with various scenarios |
| Cleanup reliability                | 100% resource release on call end | Memory profiling; re-call testing     |
| Re-entry capability                | 100% success for subsequent calls | Manual testing                        |

### Performance Metrics

| Metric                    | Target                            | Measurement                              |
| ------------------------- | --------------------------------- | ---------------------------------------- |
| PiP frame rate            | ≥ 24 fps (matching track)         | Instruments profiling                    |
| CPU overhead (PiP active) | < 5% additional CPU usage         | Instruments profiling on mid-tier device |
| Memory overhead           | < 20 MB additional memory         | Instruments profiling                    |
| Battery impact            | Negligible vs. non-PiP background | Battery profiling during extended calls  |

### Quality Metrics

| Metric                        | Target                  | Measurement                    |
| ----------------------------- | ----------------------- | ------------------------------ |
| Crash-free rate (PiP related) | > 99.9%                 | Crash reporting tools          |
| User-reported PiP issues      | Reduction from baseline | Support tickets; GitHub issues |

## References

### Upstream Implementation

- **Source files directory (PRIMARY)**: [stream-video-swift/Sources/StreamVideoSwiftUI/Utils/PictureInPicture](https://github.com/GetStream/stream-video-swift/tree/develop/Sources/StreamVideoSwiftUI/Utils/PictureInPicture) - **Copy files from here**
- **Primary reference PR**: [stream-video-swift #258](https://github.com/GetStream/stream-video-swift/pull/258) - Main PiP improvements
- **Original implementation PR**: [stream-video-swift #146](https://github.com/GetStream/stream-video-swift/pull/146) - Initial PiP (current RN SDK basis)
- **stream-video-swift repository**: https://github.com/GetStream/stream-video-swift

### Apple Documentation

- [AVPictureInPictureController](https://developer.apple.com/documentation/avkit/avpictureinpicturecontroller) - Main PiP controller class
- [AVPictureInPictureVideoCallViewController](https://developer.apple.com/documentation/avkit/avpictureinpicturevideocallviewcontroller) - Video call specific PiP view controller
- [AVSampleBufferDisplayLayer](https://developer.apple.com/documentation/avfoundation/avsamplebufferdisplaylayer) - Sample buffer rendering
- [Adopting Picture in Picture for Video Calls](https://developer.apple.com/documentation/avkit/adopting_picture_in_picture_for_video_calls) - Apple's guide

### WebRTC References

- [WebRTC iOS SDK](https://webrtc.googlesource.com/src/+/refs/heads/main/sdk/objc/) - Native iOS WebRTC implementation
- [react-native-webrtc](https://github.com/GetStream/react-native-webrtc) - React Native WebRTC fork by Stream

### Related Internal Documentation

- Stream Video React Native SDK documentation
- Existing PiP implementation in `packages/react-native-sdk/ios/`

## Appendix

### Glossary

| Term                 | Definition                                                               |
| -------------------- | ------------------------------------------------------------------------ |
| **PiP**              | Picture in Picture - iOS feature for floating video windows              |
| **AVKit**            | Apple framework providing high-level media playback UI                   |
| **Sample Buffer**    | `CMSampleBuffer` - Core Media type for timed media data                  |
| **WebRTC**           | Web Real-Time Communication - protocol for real-time video/audio         |
| **Dominant Speaker** | The participant currently speaking the most (determined by audio levels) |
| **Track**            | A single media stream (video or audio) from a participant                |

### Revision History

| Version | Date | Author | Changes                                            |
| ------- | ---- | ------ | -------------------------------------------------- |
| 1.0     | -    | -      | Initial PRD creation                               |
| 1.1     | -    | -      | Updated Goals and Implementation sections          |
| 1.2     | -    | -      | Expanded all sections with detailed specifications |
