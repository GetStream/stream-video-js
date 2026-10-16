import Foundation
import AVFoundation
import React

/// Plays the looping busy tone (0.5s 480Hz tone, 0.5s silence) used for rejected/unanswered calls.
/// All entry points hop to the main queue, as the audio session and player are main-thread state.
final class BusyTonePlayer: NSObject, AVAudioPlayerDelegate {

    private var player: AVAudioPlayer?

    func invalidate() {
        guard let player else { return }
        if player.isPlaying {
            player.stop()
        }
        self.player = nil
        removeAudioInterruptionHandling()
    }

    func play(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            self.stopPlayer() // Stop any existing playback first

            let session = AVAudioSession.sharedInstance()
            do {
                try session.setCategory(.playback, mode: .default, options: .mixWithOthers)
            } catch {
                let message = "Failed to set audio session category: \(error.localizedDescription)"
                NSLog("%@", message)
                reject("AUDIO_SESSION_ERROR", message, error)
                return
            }

            do {
                try session.setActive(true)
            } catch {
                let message = "Failed to activate audio session: \(error.localizedDescription)"
                NSLog("%@", message)
                reject("AUDIO_SESSION_ERROR", message, error)
                return
            }

            let data = Self.generateBusyToneData()
            if data.isEmpty {
                let message = "Failed to generate busy tone data"
                NSLog("%@", message)
                reject("AUDIO_GENERATION_ERROR", message, nil)
                return
            }

            let newPlayer: AVAudioPlayer
            do {
                newPlayer = try AVAudioPlayer(data: data)
            } catch {
                let message = "Failed to create audio player: \(error.localizedDescription)"
                NSLog("%@", message)
                reject("AUDIO_PLAYER_ERROR", message, error)
                return
            }
            self.player = newPlayer

            newPlayer.delegate = self
            newPlayer.numberOfLoops = -1 // Loop indefinitely
            newPlayer.volume = 0.5

            self.setupAudioInterruptionHandling()

            guard newPlayer.prepareToPlay() else {
                let message = "Failed to prepare audio player"
                NSLog("%@", message)
                reject("AUDIO_PLAYER_ERROR", message, nil)
                return
            }

            if newPlayer.play() {
                resolve(true)
            } else {
                let message = "Failed to start audio playback"
                NSLog("%@", message)
                reject("AUDIO_PLAYBACK_ERROR", message, nil)
            }
        }
    }

    func stop(resolve: @escaping RCTPromiseResolveBlock) {
        DispatchQueue.main.async {
            self.stopPlayer()
            resolve(true)
        }
    }

    private func stopPlayer() {
        guard let player else { return }
        if player.isPlaying {
            player.stop()
        }
        self.player = nil

        removeAudioInterruptionHandling()

        // Only deactivate the audio session if there are no active calls.
        // This prevents interfering with ongoing WebRTC audio sessions.
        if !StreamVideoReactNative.hasAnyActiveCall() {
            do {
                try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
            } catch {
                NSLog("Error deactivating audio session: %@", error.localizedDescription)
            }
        }
    }

    // MARK: - AVAudioPlayerDelegate

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        // Audio finished - this shouldn't happen with infinite loops
        if player === self.player {
            self.player = nil
        }
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        if player === self.player {
            self.player = nil
        }
    }

    // MARK: - Audio interruption handling

    private func setupAudioInterruptionHandling() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(audioSessionInterrupted(_:)),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )
    }

    private func removeAudioInterruptionHandling() {
        NotificationCenter.default.removeObserver(
            self,
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )
    }

    @objc private func audioSessionInterrupted(_ notification: Notification) {
        guard let typeValue = notification.userInfo?[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else { return }

        switch type {
        case .began:
            if let player, player.isPlaying {
                player.pause()
            }
        case .ended:
            let optionsValue = notification.userInfo?[AVAudioSessionInterruptionOptionKey] as? UInt ?? 0
            if AVAudioSession.InterruptionOptions(rawValue: optionsValue).contains(.shouldResume) {
                do {
                    try AVAudioSession.sharedInstance().setActive(true)
                    player?.play()
                } catch {
                    NSLog("Failed to reactivate audio session after interruption: %@", error.localizedDescription)
                }
            }
        @unknown default:
            break
        }
    }

    // MARK: - Tone generation

    /// 1 second of 16-bit mono PCM WAV: 0.5s of 480Hz tone followed by 0.5s of silence.
    private static func generateBusyToneData() -> Data {
        let sampleRate = 44100
        let duration: Float = 1.0
        let beepDuration: Float = 0.5
        let frequency: Float = 480.0
        let totalSamples = Int(duration * Float(sampleRate))
        let dataSize = UInt32(totalSamples * 2)

        var data = Data(capacity: 44 + totalSamples * 2)
        func append32(_ value: UInt32) { withUnsafeBytes(of: value.littleEndian) { data.append(contentsOf: $0) } }
        func append16(_ value: UInt16) { withUnsafeBytes(of: value.littleEndian) { data.append(contentsOf: $0) } }

        data.append(contentsOf: Array("RIFF".utf8))
        append32(36 + dataSize)
        data.append(contentsOf: Array("WAVE".utf8))
        data.append(contentsOf: Array("fmt ".utf8))
        append32(16) // PCM format chunk size
        append16(1) // PCM format
        append16(1) // Mono
        append32(UInt32(sampleRate))
        append32(UInt32(sampleRate * 2)) // Bytes per second
        append16(2) // Bytes per sample
        append16(16) // Bits per sample
        data.append(contentsOf: Array("data".utf8))
        append32(dataSize)

        for i in 0..<totalSamples {
            let t = Float(i) / Float(sampleRate)
            let cycleTime = t.truncatingRemainder(dividingBy: duration)
            if cycleTime < beepDuration {
                let amplitude = 0.4 * sinf(2.0 * Float.pi * frequency * t)
                append16(UInt16(bitPattern: Int16(amplitude * 32767.0)))
            } else {
                append16(0)
            }
        }
        return data
    }
}
