# PiP iOS Improvements Review

Reviewed the branch changes against `main`, with cross-checks against the upstream PiP implementation in `~/Downloads/stream-video-swift-develop/Sources/StreamVideoSwiftUI/Utils/PictureInPicture`. Focused on PiP controller lifecycle, content state handling, overlays, and reconnection flow.

User-provided note: PiP flow was manually tested and is working.

## Findings (ordered by severity)

1. **High – Connection quality indicator shows during reconnection**

- In reconnection state, the reconnection view is shown, but the connection quality indicator remains visible because it is not toggled in `updateOverlayVisibility()`. Since it’s added above the reconnection view, this can overlap the reconnect UI and diverges from upstream behavior where reconnection content replaces other overlays.
- Evidence:

```381:418:packages/react-native-sdk/ios/PictureInPicture/StreamPictureInPictureVideoRenderer.swift
    private func updateOverlayVisibility() {
        // Reconnection view takes highest priority
        if isReconnecting {
            NSLog("PiP - updateOverlayVisibility: isReconnecting=true, hiding avatar, showing reconnection")
            reconnectionView.isHidden = false
            avatarView.alpha = 0
            avatarView.isVideoEnabled = true
            // Hide participant overlay ONLY during reconnection (matches upstream)
            participantOverlayView.isOverlayEnabled = false
        } else {
            reconnectionView.isHidden = true
            // ...
            participantOverlayView.isOverlayEnabled = true
        }
    }
```

```336:374:packages/react-native-sdk/ios/PictureInPicture/StreamPictureInPictureVideoRenderer.swift
        addSubview(contentView)
        addSubview(avatarView)
        addSubview(reconnectionView)
        addSubview(participantOverlayView)
        addSubview(connectionQualityIndicator)
```

- Suggested fix: hide `connectionQualityIndicator` (and optionally speaking border) during reconnection, in the same branch that hides the participant overlay.

2. **Medium – Unconditional `NSLog` debug logging in production code**

- A large amount of verbose logging was added via `NSLog` across core PiP paths. This violates the repo policy (“No console noise in production builds”) and will be active in release builds.
- Examples:

```49:89:packages/react-native-sdk/ios/PictureInPicture/StreamPictureInPictureController.swift
    @objc public var participantName: String? {
        didSet {
            NSLog("PiP - Controller.participantName didSet: '\(participantName ?? "nil")', contentViewController exists: \(contentViewController != nil)")
            contentState.participantName = participantName
            contentViewController?.participantName = participantName
        }
    }
```

```268:412:packages/react-native-sdk/ios/PictureInPicture/StreamPictureInPictureVideoRenderer.swift
        if newWindow != nil {
            NSLog("PiP - Renderer: willMove(toWindow:) - added to window, track=\(track?.trackId ?? "nil"), isVideoEnabled=\(isVideoEnabled)")
            // ...
        } else {
            NSLog("PiP - Renderer: willMove(toWindow:) - removed from window")
            // ...
        }
```

- Suggested fix: gate logs behind a debug flag or the existing logging system (if available), and remove noisy per-frame or per-layout logs.

3. **Low – `PictureInPictureContentState.reset()` can publish `.avatar` after reset**

- `reset()` sets properties on the state queue, but each `didSet` triggers `updateContent()`, which treats “track=nil + isVideoEnabled=true” as `.avatar`. Because `reset()` sets `isVideoEnabled` back to `true`, queued updates can publish `.avatar` after `reset()` attempts to set `.inactive`.
- Evidence:

```76:123:packages/react-native-sdk/ios/PictureInPicture/PictureInPictureContentState.swift
    private func updateContent() {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            let newContent: PictureInPictureContent
            if self.isReconnecting {
                newContent = .reconnecting
            } else if !self.isVideoEnabled {
                newContent = .avatar(
                    participantName: self.participantName,
                    participantImageURL: self.participantImageURL
                )
            } else if self.isScreenSharing {
                newContent = .screenSharing(
                    track: self.track,
                    participantName: self.participantName
                )
            } else if self.track != nil {
                newContent = .video(
                    track: self.track,
                    participantName: self.participantName,
                    participantImageURL: self.participantImageURL
                )
            } else {
                newContent = .avatar(
                    participantName: self.participantName,
                    participantImageURL: self.participantImageURL
                )
            }
            // ...
        }
    }
```

```127:142:packages/react-native-sdk/ios/PictureInPicture/PictureInPictureContentState.swift
    func reset() {
        stateQueue.async { [weak self] in
            guard let self = self else { return }
            self.track = nil
            self.participantName = nil
            self.participantImageURL = nil
            self.isVideoEnabled = true
            self.isScreenSharing = false
            self.isReconnecting = false
            DispatchQueue.main.async {
                self.content = .inactive
            }
        }
    }
```

- Suggested fix: either suppress `updateContent()` during `reset()`, or set `isVideoEnabled = false` during reset, or update `updateContent()` to return `.inactive` when there is no `sourceView`/active controller (if that signal is available).

## Suggestions (non-blocking)

- Consider matching upstream reconnection UI shape: the upstream `PictureInPictureReconnectionView` uses padding and a rounded card. The UIKit version is full-screen with no corner radius, which is visually different from upstream. Aligning it would reduce drift.

```8:29:/Users/santhoshvaiyapuri/Downloads/stream-video-swift-develop/Sources/StreamVideoSwiftUI/Utils/PictureInPicture/PictureInPictureReconnectionView.swift
struct PictureInPictureReconnectionView: View {
    var body: some View {
        VStack {
            Text(L10n.Call.Current.reconnecting)
                .applyCallingStyle()
                .padding()
            CallingIndicator()
        }
        .padding()
        .background(
            Color(colors.callBackground).opacity(0.7).edgesIgnoringSafeArea(.all)
        )
        .cornerRadius(16)
    }
}
```

## Notes

- The JS-side reconnection detection now includes `CallingState.OFFLINE`, which matches upstream’s “offline or reconnecting” behavior. That change looks good.
- Participant overlays and speaking border now mirror upstream behavior across both video and avatar states.
