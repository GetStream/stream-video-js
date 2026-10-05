import AVFoundation
import Foundation

final class SoundPlayer {

    /// Extensions tried when an app passes a sound name without one.
    private static let supportedExtensions = ["m4a", "caf", "wav", "aiff", "mp3", "aif"]

    private var player: AVAudioPlayer?

    /// Starts the sound, replacing any sound that is already playing.
    ///
    /// - Parameter soundName: a resource in the app bundle, with or without extension. The SDK
    ///   ships no sound of its own, so an unresolvable name means nothing is played.
    func playSound(_ soundName: String?) {
        DispatchQueue.main.async { [self] in
            stopOnMainQueue()

            guard let url = resolveSoundURL(soundName) else {
                log("playSound(): no sound found for \(soundName ?? "<none>")")
                return
            }

            do {
                let player = try AVAudioPlayer(contentsOf: url)
                player.numberOfLoops = -1 // loop until the call is answered or cancelled
                player.prepareToPlay()
                player.play()
                self.player = player
                log("playSound(): playing \(url.lastPathComponent)")
            } catch {
                log("playSound(): failed to play \(url.lastPathComponent) - \(error)")
            }
        }
    }

    /// Stops the sound, if one is playing. Safe to call when nothing is playing.
    func stopSound() {
        DispatchQueue.main.async { [self] in
            stopOnMainQueue()
        }
    }

    private func stopOnMainQueue() {
        guard let player else { return }
        self.player = nil
        player.stop()
    }

    /// Resolves the sound against the app bundle, mirroring how CallKit resolves its
    /// `ringtoneSound`. The SDK ships no sound of its own.
    private func resolveSoundURL(_ soundName: String?) -> URL? {
        guard let soundName, !soundName.isEmpty else { return nil }

        let name = (soundName as NSString).deletingPathExtension
        let providedExtension = (soundName as NSString).pathExtension
        let extensions = providedExtension.isEmpty
            ? Self.supportedExtensions
            : [providedExtension]

        for ext in extensions {
            if let url = Bundle.main.url(forResource: name, withExtension: ext) {
                return url
            }
        }
        return nil
    }

    private func log(_ message: String) {
        NSLog("StreamSoundPlayer: %@", message)
    }
}
