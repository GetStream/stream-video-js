//
//  AudioUploader.swift
//  Broadcast Extension
//

import AudioToolbox
import CoreMedia
import Foundation
import OSLog

private enum AudioConstants {
    static let bufferMaxLength = 10240
    static let magic: UInt32 = 0x5353_4155 // "SSAU"
    static let headerSize = 24
}

class AudioUploader {

    @Atomic private var isReady = false
    private var connection: SocketConnection

    private var dataToSend: Data?
    private var byteIndex = 0

    private let serialQueue: DispatchQueue

    init(connection: SocketConnection) {
        self.connection = connection
        self.serialQueue = DispatchQueue(label: "org.getstream.audioUploader")

        setupConnection()
    }

    @discardableResult func send(sample buffer: CMSampleBuffer) -> Bool {
        // Drop the incoming buffer while one is still in flight. Audio buffers
        // are tiny (a few KB) so this is rare; staying current beats queuing.
        guard isReady else { return false }
        guard let data = AudioUploader.serialize(sample: buffer) else { return false }

        isReady = false
        serialQueue.async { [weak self] in
            self?.dataToSend = data
            self?.byteIndex = 0
            self?.sendDataChunk()
        }

        return true
    }
}

private extension AudioUploader {

    func setupConnection() {
        connection.didOpen = { [weak self] in
            self?.isReady = true
        }
        connection.streamHasSpaceAvailable = { [weak self] in
            self?.serialQueue.async {
                if let success = self?.sendDataChunk() {
                    self?.isReady = !success
                }
            }
        }
    }

    @discardableResult func sendDataChunk() -> Bool {
        guard let dataToSend = dataToSend else {
            return false
        }

        var bytesLeft = dataToSend.count - byteIndex
        var length = bytesLeft > AudioConstants.bufferMaxLength ? AudioConstants.bufferMaxLength : bytesLeft

        length = dataToSend[byteIndex..<(byteIndex + length)].withUnsafeBytes {
            guard let ptr = $0.bindMemory(to: UInt8.self).baseAddress else {
                return 0
            }
            return connection.writeToStream(buffer: ptr, maxLength: length)
        }

        if length > 0 {
            byteIndex += length
            bytesLeft -= length

            if bytesLeft == 0 {
                self.dataToSend = nil
                byteIndex = 0
            }
        } else {
            os_log(.error, log: broadcastLogger, "audio writeBufferToStream failure")
        }

        return true
    }

    /// Extracts interleaved PCM + format from the sample buffer and frames it.
    static func serialize(sample buffer: CMSampleBuffer) -> Data? {
        guard let formatDescription = CMSampleBufferGetFormatDescription(buffer) else {
            return nil
        }
        guard let asbdPtr = CMAudioFormatDescriptionGetStreamBasicDescription(formatDescription) else {
            return nil
        }
        let asbd = asbdPtr.pointee

        let flags = asbd.mFormatFlags
        let isFloat = (flags & kAudioFormatFlagIsFloat) != 0
        let isSignedInt = (flags & kAudioFormatFlagIsSignedInteger) != 0
        let isNonInterleaved = (flags & kAudioFormatFlagIsNonInterleaved) != 0
        let isBigEndian = (flags & kAudioFormatFlagIsBigEndian) != 0
        let bits = Int(asbd.mBitsPerChannel)
        let channels = Int(asbd.mChannelsPerFrame)

        guard asbd.mFormatID == kAudioFormatLinearPCM else {
            return nil
        }

        // Only the two formats the app-side reconstruction understands.
        let supported = (isFloat && bits == 32) || (isSignedInt && bits == 16)
        guard supported, channels > 0 else {
            return nil
        }

        guard var pcm = interleavedPCM(from: buffer, channels: channels, bitsPerChannel: bits, isNonInterleaved: isNonInterleaved) else {
            return nil
        }

        if isBigEndian, bits > 8 {
            pcm = byteSwapped(pcm, bytesPerSample: bits / 8)
        }

        // Build a length-prefixed binary frame (24-byte LE header + PCM body).
        // We always emit interleaved PCM, so isInterleaved is 1.
        var frame = Data(capacity: AudioConstants.headerSize + pcm.count)
        appendLE(&frame, AudioConstants.magic)                       // 0:  magic
        appendLE(&frame, asbd.mSampleRate.bitPattern)               // 4:  sampleRate (Float64 bits)
        appendLE(&frame, UInt16(channels))                          // 12: channels
        appendLE(&frame, UInt16(bits))                              // 14: bits
        frame.append(isFloat ? 1 : 0)                              // 16: isFloat
        frame.append(1)                                            // 17: isInterleaved
        frame.append(0)                                            // 18: reserved
        frame.append(0)                                            // 19: reserved
        appendLE(&frame, UInt32(pcm.count))                        // 20: payloadLength
        frame.append(pcm)                                          // 24: PCM body
        return frame
    }

    /// Swaps byte order of each PCM sample (for 16- or 32-bit samples).
    static func byteSwapped(_ data: Data, bytesPerSample: Int) -> Data {
        guard bytesPerSample == 2 || bytesPerSample == 4 else { return data }
        var out = data
        out.withUnsafeMutableBytes { raw in
            guard let base = raw.baseAddress else { return }
            let count = raw.count
            if bytesPerSample == 2 {
                let p = base.assumingMemoryBound(to: UInt16.self)
                for i in 0..<(count / 2) { p[i] = p[i].byteSwapped }
            } else {
                let p = base.assumingMemoryBound(to: UInt32.self)
                for i in 0..<(count / 4) { p[i] = p[i].byteSwapped }
            }
        }
        return out
    }

    // MARK: - Little-endian encoders

    static func appendLE<T: FixedWidthInteger>(_ data: inout Data, _ value: T) {
        var v = value.littleEndian
        withUnsafeBytes(of: &v) { data.append(contentsOf: $0) }
    }

    static func interleavedPCM(from buffer: CMSampleBuffer, channels: Int, bitsPerChannel: Int, isNonInterleaved: Bool) -> Data? {
        if !isNonInterleaved {
            // Interleaved: the sample buffer's data buffer is already contiguous.
            guard let blockBuffer = CMSampleBufferGetDataBuffer(buffer) else {
                return nil
            }
            var length = 0
            var dataPointer: UnsafeMutablePointer<Int8>?
            let st = CMBlockBufferGetDataPointer(blockBuffer, atOffset: 0, lengthAtOffsetOut: nil, totalLengthOut: &length, dataPointerOut: &dataPointer)
            guard st == kCMBlockBufferNoErr, let dataPointer = dataPointer, length > 0 else {
                return nil
            }
            return Data(bytes: dataPointer, count: length)
        }

        // Non-interleaved (planar): use an AudioBufferList to reach each plane.
        var blockBuffer: CMBlockBuffer?
        let maxBuffers = max(channels, 1)
        let buffers = AudioBufferList.allocate(maximumBuffers: maxBuffers)
        defer { free(buffers.unsafeMutablePointer) }

        let status = CMSampleBufferGetAudioBufferListWithRetainedBlockBuffer(
            buffer,
            bufferListSizeNeededOut: nil,
            bufferListOut: buffers.unsafeMutablePointer,
            bufferListSize: AudioBufferList.sizeInBytes(maximumBuffers: maxBuffers),
            blockBufferAllocator: nil,
            blockBufferMemoryAllocator: nil,
            flags: kCMSampleBufferFlag_AudioBufferList_Assure16ByteAlignment,
            blockBufferOut: &blockBuffer
        )
        guard status == noErr else {
            return nil
        }

        let bytesPerSample = bitsPerChannel / 8
        guard bytesPerSample > 0, buffers.count == channels else {
            return nil
        }

        let minPlaneBytes = buffers.reduce(Int.max) { min($0, Int($1.mDataByteSize)) }
        let frameCount = minPlaneBytes / bytesPerSample
        guard frameCount > 0 else { return nil }
        var output = Data(count: frameCount * channels * bytesPerSample)
        output.withUnsafeMutableBytes { dstRaw in
            guard let dst = dstRaw.baseAddress else { return }
            for ch in 0..<channels {
                guard let src = buffers[ch].mData else { continue }
                for frame in 0..<frameCount {
                    let srcOffset = frame * bytesPerSample
                    let dstOffset = (frame * channels + ch) * bytesPerSample
                    memcpy(dst + dstOffset, src + srcOffset, bytesPerSample)
                }
            }
        }
        return output
    }
}
