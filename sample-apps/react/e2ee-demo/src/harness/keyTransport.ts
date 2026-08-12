/**
 * Key transport abstraction for the E2EE harness.
 *
 * In this harness all participants share one browser tab, so the engine's
 * transport simply calls `EncryptionManager.setKey()` on the recipient's
 * manager directly (see E2EEHarness.sendKey).
 *
 * In a production app, participants are on different devices. Implement a
 * SendKeyFn that delivers the key over your secure channel (REST, WebSocket),
 * encrypted in transit (TLS minimum; per-recipient ECDH/ECIES for maximum
 * security), and have the receiving side call
 * `e2ee.setKey(fromUserId, keyIndex, rawKey)` on delivery.
 */
export type SendKeyFn = (
  toUserId: string,
  fromUserId: string,
  keyIndex: number,
  key: ArrayBuffer,
) => void;
