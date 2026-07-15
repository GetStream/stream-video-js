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
  /**
   * Attach an encryption transform to an outgoing track's sender. `trackType`
   * is an optional label (e.g. the track kind) used only to bucket perf stats,
   * so two same-codec senders (camera and screen share) are reported apart.
   */
  encrypt(sender: RTCRtpSender, codec?: string, trackType?: string): void;
  /**
   * Attach a decryption transform to an incoming track's receiver. `trackType`
   * is an optional label used only to bucket perf stats, so a peer's video and
   * audio are reported apart rather than summed under their userId.
   */
  decrypt(receiver: RTCRtpReceiver, userId: string, trackType?: string): void;
  /**
   * Optional. Return `true` if this manager relies on the legacy Insertable
   * Streams API (`createEncodedStreams`), which requires the RTCPeerConnection
   * to be created with `encodedInsertableStreams: true`. Managers that use
   * `RTCRtpScriptTransform` can omit this.
   */
  shouldUseInsertableStreams?(): boolean;
}
