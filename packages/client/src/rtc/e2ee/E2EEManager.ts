/**
 * What the RTC layer needs to attach E2EE to a track. {@link EncryptionManager}
 * is the built-in AES-GCM implementation, but `Call.setE2EEManager` takes any:
 * an integrator can plug in another scheme, RFC 9605 SFrame for example, by
 * attaching their own encoded transform in these two methods.
 */
export interface E2EEManager {
  /**
   * Synchronously attach a transform that encrypts the sender's outgoing frames.
   * Must support a sender without a track, and throw if attachment fails.
   *
   * `sender.track` is always null here: the track is attached only after this
   * returns, so implementations must not read it. Use `codec` and `trackType`
   * instead.
   *
   * `trackType` only groups perf stats, keeping a camera and screen share apart.
   */
  encrypt(sender: RTCRtpSender, codec?: string, trackType?: string): void;
  /** `trackType` only groups perf stats, keeping a peer's audio and video apart. */
  decrypt(receiver: RTCRtpReceiver, userId: string, trackType?: string): void;
}
