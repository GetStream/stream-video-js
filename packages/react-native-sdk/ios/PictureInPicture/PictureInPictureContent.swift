//
// Copyright © 2024 Stream.io Inc. All rights reserved.
//
// Adapted from stream-video-swift for React Native SDK
// Original: https://github.com/GetStream/stream-video-swift/blob/develop/Sources/StreamVideoSwiftUI/Utils/PictureInPicture/PictureInPictureContent.swift
//

import Foundation

/// Represents the content state for the Picture-in-Picture window.
///
/// This enum defines the different states that the PiP window can display:
/// - `inactive`: No content is being shown (PiP is not active)
/// - `video`: Live video from a participant (camera or screen share)
/// - `avatar`: Participant avatar placeholder (when video is disabled)
/// - `screenSharing`: Screen share content with indicator overlay
/// - `reconnecting`: Connection recovery indicator
///
/// The React Native SDK receives content state from the JavaScript layer through
/// the bridge, unlike the upstream Swift SDK which observes call state internally.
enum PictureInPictureContent: Equatable, CustomStringConvertible {
    /// No content - PiP is inactive or transitioning
    case inactive

    /// Video content from a participant
    /// - Parameters:
    ///   - track: The WebRTC video track to render
    ///   - participantName: The participant's display name (for fallback)
    ///   - participantImageURL: URL to participant's profile image (for fallback)
    case video(track: RTCVideoTrack?, participantName: String?, participantImageURL: String?)

    /// Screen sharing content
    /// - Parameters:
    ///   - track: The WebRTC video track containing screen share
    ///   - participantName: Name of the participant sharing their screen
    case screenSharing(track: RTCVideoTrack?, participantName: String?)

    /// Avatar placeholder shown when video is disabled
    /// - Parameters:
    ///   - participantName: The participant's display name (for initials)
    ///   - participantImageURL: URL to participant's profile image
    case avatar(participantName: String?, participantImageURL: String?)

    /// Connection recovery indicator
    case reconnecting

    // MARK: - CustomStringConvertible

    var description: String {
        switch self {
        case .inactive:
            return ".inactive"
        case let .video(track, name, _):
            return ".video(track:\(track?.trackId ?? "nil"), name:\(name ?? "-"))"
        case let .screenSharing(track, name):
            return ".screenSharing(track:\(track?.trackId ?? "nil"), name:\(name ?? "-"))"
        case let .avatar(name, _):
            return ".avatar(name:\(name ?? "-"))"
        case .reconnecting:
            return ".reconnecting"
        }
    }

    // MARK: - Equatable

    static func == (lhs: PictureInPictureContent, rhs: PictureInPictureContent) -> Bool {
        switch (lhs, rhs) {
        case (.inactive, .inactive):
            return true
        case let (.video(lhsTrack, lhsName, lhsImage), .video(rhsTrack, rhsName, rhsImage)):
            return isSameTrackInstance(lhsTrack, rhsTrack)
                && lhsName == rhsName
                && lhsImage == rhsImage
        case let (.screenSharing(lhsTrack, lhsName), .screenSharing(rhsTrack, rhsName)):
            return isSameTrackInstance(lhsTrack, rhsTrack)
                && lhsName == rhsName
        case let (.avatar(lhsName, lhsImage), .avatar(rhsName, rhsImage)):
            return lhsName == rhsName
                && lhsImage == rhsImage
        case (.reconnecting, .reconnecting):
            return true
        default:
            return false
        }
    }

    /// Track identity must be reference-based so reconnect-created tracks
    /// with reused `trackId` still propagate through content updates.
    private static func isSameTrackInstance(_ lhs: RTCVideoTrack?, _ rhs: RTCVideoTrack?) -> Bool {
        switch (lhs, rhs) {
        case (nil, nil):
            return true
        case let (lhsTrack?, rhsTrack?):
            return lhsTrack === rhsTrack
        default:
            return false
        }
    }

    // MARK: - Convenience Properties

    /// Returns the video track if this content has one, nil otherwise
    var track: RTCVideoTrack? {
        switch self {
        case let .video(track, _, _):
            return track
        case let .screenSharing(track, _):
            return track
        case .inactive, .avatar, .reconnecting:
            return nil
        }
    }

    /// Returns the participant name if available
    var participantName: String? {
        switch self {
        case let .video(_, name, _):
            return name
        case let .screenSharing(_, name):
            return name
        case let .avatar(name, _):
            return name
        case .inactive, .reconnecting:
            return nil
        }
    }

    /// Returns the participant image URL if available
    var participantImageURL: String? {
        switch self {
        case let .video(_, _, imageURL):
            return imageURL
        case let .avatar(_, imageURL):
            return imageURL
        case .inactive, .screenSharing, .reconnecting:
            return nil
        }
    }

    /// Whether this content represents an active video stream
    var hasActiveVideo: Bool {
        switch self {
        case .video, .screenSharing:
            return true
        case .inactive, .avatar, .reconnecting:
            return false
        }
    }

    /// Whether this content is screen sharing
    var isScreenSharing: Bool {
        if case .screenSharing = self {
            return true
        }
        return false
    }

    /// Whether this content shows an avatar
    var isShowingAvatar: Bool {
        if case .avatar = self {
            return true
        }
        return false
    }

    /// Whether this content shows the reconnection view
    var isReconnecting: Bool {
        if case .reconnecting = self {
            return true
        }
        return false
    }
}
