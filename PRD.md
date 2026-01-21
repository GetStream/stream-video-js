# Picture in Picture iOS improvements

## Introduction

Improve the Picture in Picture iOS implementation on `packages/react-native-sdk/ios`

## Implementation

Current implementation is based on `stream-video-swift` PR: https://github.com/GetStream/stream-video-swift/pull/146

In the new Implementation it should be based on this PR https://github.com/GetStream/stream-video-swift/pull/258 and further improvements made on the files later in the `stream-video-swift` library.

The React native wrapper methods should not be changed.

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

### US-001: Auto-start PiP on background (when enabled)

**Description:** As a user, when I background the app during a call, PiP should start automatically (if supported) so I can keep watching while using other apps.

**Acceptance Criteria:**

- [x] On iOS devices that support PiP for video calls (iOS 15+ for our PiP view controller), backgrounding the app starts PiP automatically when PiP is enabled.
- [x] If PiP is disabled via existing controls, PiP does **not** start automatically.
- [x] JS is notified of PiP state via the existing native event/callback so `useIsInPiPMode()` is correct.

### US-002: PiP renders the correct participant and doesn’t go “blank”

**Description:** As a user, PiP should show an actively-updating video feed and select the most relevant participant (dominant speaker, preferring remote).

**Acceptance Criteria:**

- [x] PiP renders the dominant speaker; if the dominant speaker is local and a remote participant exists, PiP prefers the remote participant.
- [x] When the underlying WebRTC track is replaced/changes, PiP continues rendering without showing a blank local track.
- [x] When screen share is active, PiP can render the screen share track (consistent with current JS selection logic).

### US-003: PiP window sizing is stable and configurable

**Description:** As a developer, PiP should have a safe default size and optionally adapt to the incoming track dimensions without triggering iOS errors.

**Acceptance Criteria:**

- [x] The PiP content view controller never uses `preferredContentSize = .zero` (avoids iOS `PGPegasus code:-1003`).
- [x] When JS supplies track dimensions via the existing native command, iOS PiP updates preferred size accordingly (with sane bounds).
- [x] Adaptive sizing updates when track size changes, without flicker.

### US-004: PiP stops and cleans up on call end / leave

**Description:** As a user, PiP should stop when the call is no longer active so I don't see stale content or waste battery.

**Acceptance Criteria:**

- [x] When the call ends (`call.ended`) or the user leaves (calling state becomes `LEFT`), PiP is stopped via the existing native call-closed path.
- [x] Native resources are released: PiP controller content source cleared, delegates removed, renderers detached, and timers/subscriptions cancelled.
- [x] A subsequent call can start PiP again without requiring an app restart.

### US-005: PiP UI controls and overlays match upstream Swift library

**Description:** As a user, I should see the same UI controls and overlays in PiP that are available in the native `stream-video-swift` library, ensuring a consistent experience.

**Acceptance Criteria:**

- [ ] Any UI overlays (e.g., participant name labels, mute indicators) present in `stream-video-swift` PiP are ported to the React Native SDK.
- [ ] Any interactive controls added to PiP in upstream are implemented with equivalent functionality.
- [ ] Visual styling (colors, fonts, positioning) of overlays matches the upstream implementation.
- [ ] Overlays update correctly when participant state changes (e.g., mute/unmute, name changes).

## Non-Goals

- **No Android changes**: Android PiP and lifecycle behavior are out of scope here.
- **No public JS API changes**: wrapper methods and public props remain the same; improvements are internal/native.
- **No iOS < 15 parity**: we target iOS 15+ for the video-call PiP view controller path.
- **No new PiP UI controls beyond upstream**: we won't add interactive controls or overlays inside PiP beyond what exists in `stream-video-swift`; we port upstream UI, not create new UI.

## Technical Considerations

- **Native iOS implementation**:
  - Use `AVPictureInPictureController.ContentSource(activeVideoCallSourceView:contentViewController:)` (iOS 15+) with `AVPictureInPictureVideoCallViewController`.
  - Render WebRTC frames to a sample-buffer based renderer (`AVSampleBufferDisplayLayer` pipeline) to match the upstream approach.
  - Window sizing is managed via a policy (fixed/adaptive). Adaptive updates `preferredContentSize` based on track size; never use `.zero`.
- **JS ↔ Native integration (no public API changes)**:
  - The native view (`RTCViewPip`) receives the selected stream/track and emits `onPiPChange(active)`.
  - JS sends `setPreferredContentSize(width,height)` based on tracked video dimensions.
  - JS sends `onCallClosed` on call end/leave to force native cleanup.
- **Performance**:
  - Resize/downsample frames when incoming frames exceed PiP window size; skip frames when the size ratio is very large.
  - Only attach the renderer to the track while the PiP view is attached to a window (PiP visible).
- **Manual test matrix**:
  - iOS 15/16/17/18.
  - Background → PiP starts; foreground → PiP stops.
  - Dominant speaker changes; participant join/leave; camera toggle; screen share start/stop.
  - End call while in PiP; leave call while in PiP; ensure cleanup and ability to re-enter PiP in the next call.
