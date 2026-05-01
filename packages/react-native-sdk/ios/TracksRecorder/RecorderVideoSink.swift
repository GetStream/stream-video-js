//
// Copyright © 2026 Stream.io Inc. All rights reserved.
//

import CoreMedia
import CoreVideo
import Foundation
import WebRTC

/// Per-track video sink used by `TracksRecorderManager`. Implements
/// `RTCVideoRenderer` so it can be attached directly to an `RTCVideoTrack`.
///
/// Each delivered `RTCVideoFrame` is normalised to a CVPixelBuffer in the
/// hardware H.264 encoder's native format — **NV12**
/// (`kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange`). For
/// `RTCCVPixelBuffer` sources (camera passthrough) we use the underlying
/// pixel buffer directly. For `RTCI420Buffer` and other YUV sources we
/// allocate a fresh IOSurface-backed NV12 buffer and copy planes (no
/// color-space conversion required).
///
/// **Why NV12 and not BGRA?** AVAssetWriter's hardware encoder accepts
/// both, but BGRA requires an internal colour-space conversion that
/// fails with VideoToolbox `-16364` on certain stride/alignment
/// combinations a few frames in. NV12 is the encoder's native input;
/// passing it directly bypasses the failure entirely.
///
/// Threading: `renderFrame` runs on a WebRTC frame-delivery thread; the
/// callback must be safe to invoke from there. The manager serialises
/// further access on its own queue.
@objc final class RecorderVideoSink: NSObject, RTCVideoRenderer {

    typealias FrameHandler = (_ pixelBuffer: CVPixelBuffer, _ width: Int32, _ height: Int32, _ timestampNs: Int64) -> Void

    /// One-shot diagnostic: prints the first frame the sink sees so we can
    /// confirm WebRTC is actually delivering frames to this renderer.
    private static var firstFrameLogged = false

    private let frameHandler: FrameHandler

    init(frameHandler: @escaping FrameHandler) {
        self.frameHandler = frameHandler
        super.init()
    }

    // MARK: - RTCVideoRenderer

    func setSize(_ size: CGSize) {
        // No-op: pixel buffer dimensions are derived from each incoming frame.
    }

    func renderFrame(_ frame: RTCVideoFrame?) {
        guard let frame = frame, frame.width > 0, frame.height > 0 else { return }
        if !RecorderVideoSink.firstFrameLogged {
            RecorderVideoSink.firstFrameLogged = true
            NSLog("[TracksRecorder] RecorderVideoSink first frame: %dx%d buffer=%@",
                  frame.width, frame.height, String(describing: type(of: frame.buffer)))
        }

        let pixelBuffer: CVPixelBuffer?
        if let cvBuffer = frame.buffer as? RTCCVPixelBuffer {
            // Camera passthrough — already a CVPixelBuffer (typically NV12
            // on iOS).
            pixelBuffer = cvBuffer.pixelBuffer
        } else if let i420 = frame.buffer as? RTCI420Buffer {
            pixelBuffer = Self.makeNV12PixelBuffer(fromI420: i420)
        } else {
            // Other YUV variants — normalise via toI420() first.
            let i420 = frame.buffer.toI420()
            if let concrete = i420 as? RTCI420Buffer {
                pixelBuffer = Self.makeNV12PixelBuffer(fromI420: concrete)
            } else {
                pixelBuffer = nil
            }
        }

        guard let outputBuffer = pixelBuffer else { return }
        frameHandler(outputBuffer, frame.width, frame.height, frame.timeStampNs)
    }

    // MARK: - I420 → NV12

    /// Allocates a fresh IOSurface-backed NV12 `CVPixelBuffer` and copies
    /// the I420 source's planes into it (Y as-is, U+V interleaved into the
    /// UV plane). No colour-space conversion — this is purely a plane
    /// reorder, so the operation is both fast and bit-exact.
    private static func makeNV12PixelBuffer(fromI420 i420: RTCI420Buffer) -> CVPixelBuffer? {
        let width = Int(i420.width)
        let height = Int(i420.height)
        let chromaWidth = Int(i420.chromaWidth)
        let chromaHeight = Int(i420.chromaHeight)

        var pixelBuffer: CVPixelBuffer?
        let attrs: [String: Any] = [
            kCVPixelBufferIOSurfacePropertiesKey as String: [:] as [String: Any],
        ]
        let status = CVPixelBufferCreate(
            kCFAllocatorDefault,
            width,
            height,
            kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
            attrs as CFDictionary,
            &pixelBuffer
        )
        guard status == kCVReturnSuccess, let buffer = pixelBuffer else { return nil }

        CVPixelBufferLockBaseAddress(buffer, [])
        defer { CVPixelBufferUnlockBaseAddress(buffer, []) }

        // Plane 0: Y — direct copy.
        guard let yDest = CVPixelBufferGetBaseAddressOfPlane(buffer, 0) else { return nil }
        let yDestStride = CVPixelBufferGetBytesPerRowOfPlane(buffer, 0)
        let ySrcStride = Int(i420.strideY)
        let ySrc = UnsafeRawPointer(i420.dataY)
        if ySrcStride == yDestStride {
            memcpy(yDest, ySrc, ySrcStride * height)
        } else {
            let copyBytes = min(ySrcStride, yDestStride)
            for row in 0..<height {
                memcpy(
                    yDest.advanced(by: row * yDestStride),
                    ySrc.advanced(by: row * ySrcStride),
                    copyBytes
                )
            }
        }

        // Plane 1: UV — interleave I420's U and V planes.
        guard let uvDestRaw = CVPixelBufferGetBaseAddressOfPlane(buffer, 1) else { return nil }
        let uvDestStride = CVPixelBufferGetBytesPerRowOfPlane(buffer, 1)
        let uvDest = uvDestRaw.assumingMemoryBound(to: UInt8.self)
        let uSrcStride = Int(i420.strideU)
        let vSrcStride = Int(i420.strideV)
        let uSrc = i420.dataU
        let vSrc = i420.dataV
        for row in 0..<chromaHeight {
            let uRow = uSrc.advanced(by: row * uSrcStride)
            let vRow = vSrc.advanced(by: row * vSrcStride)
            let uvRow = uvDest.advanced(by: row * uvDestStride)
            for col in 0..<chromaWidth {
                uvRow[col * 2] = uRow[col]
                uvRow[col * 2 + 1] = vRow[col]
            }
        }

        return buffer
    }
}
