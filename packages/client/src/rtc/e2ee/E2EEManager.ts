/**
 * Minimal contract the RTC layer needs to attach E2EE to a track's sender or
 * receiver. {@link EncryptionManager} is the built-in AES-GCM implementation,
 * but `Call.setE2EEManager` accepts any implementation - so an integrator can
 * plug in a custom scheme (for example RFC 9605 SFrame) by attaching their own
 * encoded transform inside these two methods, without using Stream's worker.
 *
 * These are the only members Publisher and Subscriber ever call.
 */
export interface E2EEManager {
  /** Attach an encryption transform to an outgoing track's sender. */
  encrypt(sender: RTCRtpSender, codec?: string): void;
  /** Attach a decryption transform to an incoming track's receiver. */
  decrypt(receiver: RTCRtpReceiver, userId: string): void;
}
