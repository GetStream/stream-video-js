# Stream Video E2EE: cross-SDK implementation spec

**Status:** draft, derived from the JS reference implementation in `packages/client/src/rtc/e2ee`.
**Audience:** SDK teams implementing E2EE for iOS, Android, Flutter, Unity.
**Goal:** every SDK exposes the same public API and produces byte-identical frames, so any two platforms interoperate in the same call.

---

## 1. Overview

Media frames are encrypted with **AES-GCM** inside a WebRTC _encoded transform_ (frame-level hook between encoder and packetizer, and between depacketizer and decoder). The SFU forwards ciphertext and never holds a key.

There is **one on-wire scheme**, `version = 1`, used by every supported codec (Opus, VP8, VP9, H.264):

```
[ clear header ][ AES-GCM ciphertext + tag ][ 20-byte trailer ]
```

**AV1 is not supported.**

**Endianness:** all multi-byte integers are **big-endian**.

---

## 2. Public API contract

Every SDK should expose the same shape. Names may be idiomatic per platform (`isSupported` -> `isSupported()`, `is_supported`, etc.), but semantics must match.

```ts
// capability check, before showing any E2EE UI
EncryptionManager.isSupported(): boolean

// construction; binds the manager to the local user
EncryptionManager.create(userId, {
  algorithm?: 'AES-128-GCM' | 'AES-256-GCM',  // default AES-128-GCM
}): Promise<EncryptionManager>

// key distribution (host-owned: the SDK never derives or exchanges keys)
setKey(userId: string, keyIndex: number, rawKey: bytes): void
setSharedKey(keyIndex: number, rawKey: bytes): void
removeKeys(userId: string): void
removeSharedKey(keyIndex: number): void

// diagnostics
enablePerformanceReporting(enabled: boolean): void
requestKeyState(): void

// lifecycle
dispose(): void

// events (see §10)
on(event, handler) / off(event, handler)
```

Wiring into a call:

```ts
import { EncryptionManager } from '@stream-io/video-react-sdk';

const call = client.call(type, id);
if (EncryptionManager.isSupported()) {
  const e2ee = await EncryptionManager.create(call.currentUserId);
  e2ee.setSharedKey(0, keyBytes);
  call.setE2EEManager(e2ee); // MUST be called before join()
}

await call.join();
```

### Rules

- **`create` throws when E2EE cannot run**, rather than degrading: no Encoded Transform API in this browser, or the worker could not be constructed (on web, a CSP `worker-src` that omits `blob:` is the common cause). Guard with `isSupported()` and handle the rejection. There is deliberately no silent-fallback mode, because falling back means publishing cleartext on a call the user was told is encrypted.
- **`setE2EEManager` before `join`.** The peer connections must be created with the transform hook in place. Calling it after join throws.
- **`keyIndex` is 0-255** (one trailer byte). Reject anything else at the API boundary. The index identifies a key slot, not a monotonic sequence, so a long-running rotation may wrap 255 → 0 and re-use low indices. Reusing an occupied index replaces that slot immediately, so the host must not reuse it until frames from the old epoch can no longer be in flight.
- **`rawKey` is exactly 16 bytes** (AES-128) or **32 bytes** (AES-256). Reject other lengths.
- **The key buffer is copied, not consumed.** Callers may re-import the same bytes.
- A successful **`setSharedKey(keyIndex, rawKey)`** stores or replaces that shared receive epoch and makes it the active shared epoch for encryption. A failed import changes neither the key ring nor the active epoch.
- **`removeSharedKey(keyIndex)`** removes exactly that shared receive epoch. Removing the active epoch disables shared-key encryption until another `setSharedKey` succeeds; an older retained epoch is never reactivated implicitly.
- **Join request carries `e2ee: true`** so the backend knows the call is encrypted.
- The internal attach points (`encrypt(sender, codec, trackType)` / `decrypt(receiver, userId, trackType)`) are called by the RTC layer, not by apps. Keeping them behind a small interface lets an integrator plug in a different scheme (e.g. SFrame).

---

## 3. Key management and identity

A per-user key is identified by **`(userId, keyIndex)`**. A shared key is identified by
**`keyIndex`**.

- **Per-user keys** (`setKey`): the encoder looks up the local user's latest key; each decoder looks up the remote sender's key by the `keyIndex` carried in the frame.
- **Shared keys** (`setSharedKey`): an indexed fallback receive-key ring used for any user without a per-user key at the requested index. The most recently imported shared epoch is explicitly active for encryption; older epochs remain receive-only so delayed frames survive a rotation.
- **Resolution on decode:** per-user entry at that `keyIndex` first; else the shared-key entry at that index; else no key (frame dropped, `missing_key` fired).
- **Resolution on encode:** the most recently imported per-user key for the local user; else the active shared key. Retained inactive shared epochs must never be selected for encryption.
- **`removeKeys(userId)`** drops that user's key material but **must not reset the frame counter** (see §9).
- **`removeSharedKey(keyIndex)`** drops only that shared epoch. If it was active, shared-key encode fallback becomes unavailable; retained older epochs remain usable for decryption but inactive for encryption.

### Shared-key rotation

The host owns the grace period and retires old epochs explicitly:

```ts
manager.setSharedKey(7, nextKey); // epoch 7 becomes active; older epochs remain
// distribute epoch 7 and allow delayed frames from the prior epoch to drain
manager.removeSharedKey(6); // epoch 6 can no longer decrypt
```

All participants must use the same `keyIndex` for the same shared key. Do not reuse an
index while frames encrypted with its previous material may still arrive: the new import
replaces that slot, so those delayed frames would resolve the replacement key and fail
authentication.

### Per-import state

Every key import generates:

- a fresh **random 8-byte `ivPrefix`** (sender-side only), and
- an 8-byte **fingerprint** = first 8 bytes of `SHA-256(rawKey)`, for diagnostics only.

The fresh prefix per import is what makes re-importing the same raw key safe: it cannot reproduce an `(ivPrefix, counter)` pair from an earlier import. **Receivers never consult a local prefix** - they read it from the frame.

The prefix must come from a **cryptographic RNG**, never from a user id, session id, timestamp or counter. Under a shared key it is the only thing separating one participant's IVs from another's (§9 rule 5, Appendix A.2).

---

## 4. Crypto primitives

- **Cipher:** AES-GCM, 128-bit tag (the default; the tag is appended to the ciphertext).
- **Key sizes:** 128-bit or 256-bit, selected at manager construction.
- **IV:** 12 bytes, `ivPrefix (8) || frameCounter (4, big-endian)`.
- **Frame counter:** a single monotonic counter per manager, **shared across all of the local user's tracks and codecs**. Starts at 0, first frame uses 1.
- **AAD:** the frame's clear header. Authenticated, not encrypted - see §5.3.

> **IV-uniqueness contract.** For a given key, never encrypt two different frames under the same **IV**, where `IV = ivPrefix ∥ counter`. Reusing one is catastrophic under AES-GCM.
>
> Note the invariant is on the IV, not on the counter. **`(key, counter)` repeats constantly and that is expected**: under a shared key every participant starts at counter 1, as does the same user on a second device, and so does any sender that reconnects with a fresh manager. Two mechanisms cover two different scopes, and both are load-bearing:
>
> - **Within one sender**, the monotonic counter separates frames. It must be **one counter for the whole manager, not one per track** - a per-track counter would let one user's audio and video frames land on the same counter under the same key.
> - **Between senders**, the counter separates nothing, because they all start near 0. Only the random per-import `ivPrefix` keeps them apart, which is why §9 rule 5 requires a cryptographic RNG (Appendix A.2).

---

## 5. Trailer format (`version = 1`)

Applies to Opus, VP8, VP9, H.264, and audio frames whose codec was not supplied. Video with no codec fails closed (§5.1).

```
+------------------+----------------------------+-------------------+
|  clear header    |  AES-GCM ciphertext + tag  |  trailer (20 B)   |
|  (clearBytes)    |                            |                   |
+------------------+----------------------------+-------------------+
        |
        +-- plaintext, and passed as AAD (§5.3)
```

### 5.1 Clear bytes per codec

The leading `clearBytes` bytes stay in plaintext so the SFU can still read frame headers (keyframe detection, layer selection). They are passed as AAD, so the SFU can read them but cannot alter them undetected (§5.3).

| Codec (`codec` string)       | Clear bytes                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| `opus` / any audio frame     | **1** (the Opus TOC byte)                                                                        |
| `vp8`                        | **10** on keyframes, **3** on delta frames                                                       |
| `vp9`                        | **10** on keyframes, **3** on delta frames                                                       |
| `h264`                       | offset of the first slice NALU's **header byte + 2** (see §5.4); **0** if no slice NALU is found |
| codec not supplied/supported | **fail closed**: drop the frame, emit `encryption_failed`                                        |

**Clamp `clearBytes` to the frame length, in every rule.** A frame shorter than its nominal clear header is rare but not impossible, and the clamp is part of the wire format rather than a defensive nicety: an SDK that omits it computes a larger `clearBytes` than one that applies it, so the two sides build AADs of different **lengths**, and a length mismatch fails the tag every time (§5.3, consequence 2). The encoder would also read past the end of the frame to assemble the header.

### 5.2 Trailer layout (20 bytes, appended at the end of the frame)

| Offset | Size | Field                 | Notes                                                    |
| ------ | ---- | --------------------- | -------------------------------------------------------- |
| 0      | 4    | `frameCounter`        | big-endian, low 32 bits of the IV                        |
| 4      | 8    | `ivPrefix`            | sender's random prefix for this key import               |
| 12     | 1    | `keyIndex`            | 0-255                                                    |
| 13     | 2    | `clearBytes \| flags` | bit 15 = `RBSP_FLAG`, bits 0-14 = clearBytes (max 32767) |
| 15     | 1    | `version`             | `0x01`; frozen position, see below                       |
| 16     | 4    | `magic`               | `0xE2EEFEED`; frozen position, see below                 |

**Overhead:** 16 (GCM tag) + 20 (trailer) = **36 bytes per frame**, plus RBSP escape bytes for H.264.

**The identification suffix is frozen across versions.** The last 5 bytes of the frame are `version ∥ magic` in **every** version of this format, present and future, and are read relative to the **end of the frame** rather than to a trailer start. That is what lets a receiver recognize "encrypted, but written by a version I do not implement" without understanding the trailer that carries it (§12), and it is why a future version may lengthen the trailer without stranding older receivers.

### 5.3 AAD (Additional Authenticated Data)

AES-GCM is an AEAD cipher: it takes a third input alongside the key and the plaintext, called the _additional authenticated data_. The AAD is **covered by the authentication tag but not encrypted**. It is also **not part of the output** - GCM does not transmit it. Both sides must supply the identical bytes independently, or the tag check fails.

```
AAD       = frame[0 .. clearBytes)        # the clear header; empty when clearBytes == 0
plaintext = frame[clearBytes .. end]
```

The receiver does not need the AAD delivered separately: it is the literal first `clearBytes` bytes of the frame it just received, and `clearBytes` is in the trailer.

**Why the clear header is AAD and not just plaintext.** The SFU must read codec headers to detect keyframes and select layers, so those bytes cannot be encrypted. But leaving them merely unencrypted would let any relay rewrite them undetected - flip a frame's keyframe bit and the receiver's decoder desynchronises. Making them AAD gives the SFU **read access without write access**: it can parse the header, and any modification to it breaks the tag on the very next decrypt.

**Three consequences implementers must respect:**

1. **Byte-exact agreement.** One differing byte in the AAD makes decryption fail. There is no partial match.
2. **Length is part of the agreement.** An AAD of a different _length_ fails just as hard as different content.
3. **Empty AAD is normal**, not an error case. It happens on H.264 with no slice NALU, and on video with a codec the encoder does not recognize. Pass a zero-length buffer; in GCM that is equivalent to supplying no AAD at all, so either form interoperates.

**What is not in the AAD.** The 20-byte trailer is excluded. Every field except `version` and `magic` still fails closed:

| Tampered field             | Result                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `frameCounter`, `ivPrefix` | different IV, tag fails, frame dropped                                                                                                    |
| `keyIndex`                 | wrong key or no key, tag fails or `missing_key`, frame dropped                                                                            |
| `clearBytes` / RBSP flag   | different AAD and a different ciphertext split, tag fails, frame dropped                                                                  |
| `version`, `magic`         | the frame is no longer recognized as encrypted. It is **forwarded to the decoder as ciphertext** and reported as `unencrypted_frame` (§7) |

The last row is the one worth knowing: it is not a decryption failure, it is a downgrade. Media renders as garbage rather than being dropped.

### 5.4 H.264 quirk: RBSP escaping

**Problem.** Ciphertext is uniformly random and will contain `00 00 01` / `00 00 00 01` byte runs. `libwebrtc` H.264 packetizer scans the frame for Annex-B start codes and would split it at those false boundaries, destroying the frame.

**Rule.** For H.264 with `clearBytes > 0`, apply RBSP emulation-prevention over **ciphertext and trailer as one contiguous stream** before appending:

- Insert `0x03` after any `00 00` run when the next byte is `0x00`-`0x03`.
- **Seed the escaper with the clear header's trailing `0x00` count, capped at 2.** The packetizer scans the whole frame, and the header's tail and the escaped stream are contiguous on the wire: a header ending in `0x00` followed by ciphertext starting `00 01` would otherwise form a start code across the boundary that the escaper never saw. Browser encoders do not produce a header ending in `0x00` (the last clear byte is the first slice-header byte, and `first_mb_in_slice = 0` forces its top bit on), but multi-slice hardware encoders can, so the seed is part of the wire format. Both sides derive it from the same clear bytes; nothing extra travels in the frame.
- Set `RBSP_FLAG` (bit 15 of the `clearBytes` field).
- Frame becomes `[clear header][ escaped(ciphertext || trailer) ]`.

**Why the trailer is escaped with the ciphertext, yet still readable.** The last **7** trailer bytes (`clearBytes|flag`, `version`, `magic`) are start-code-safe by construction: the RBSP flag forces the `clearBytes` high byte to `>= 0x80`, which breaks any zero run reaching them. They therefore pass through escaping unchanged, and the decoder can read them straight off the raw frame tail to discover `clearBytes` and the RBSP flag. The first 13 bytes (`frameCounter`, `ivPrefix`, `keyIndex`) sit **inside** the escaped region and are only valid after un-escaping.

**Decode order for an RBSP frame:**

1. Read the raw tail to get `clearBytes`, `isRbsp`, `version`, `magic`.
2. Un-escape `frame[clearBytes .. end]`, seeded with the clear header's trailing `0x00` count (capped at 2) exactly like the encoder, so an escape byte sitting right at the boundary is recognized.
3. If the un-escaped unit is shorter than 20 bytes, **drop the frame** (both `clearBytes` and the flag are plaintext, so a relay can forge exactly this shape).
4. Re-read `frameCounter` / `ivPrefix` / `keyIndex` from the un-escaped unit's last 20 bytes.
5. Ciphertext is the un-escaped unit minus its last 20 bytes.

**Finding the slice NALU.** Walk Annex-B start codes; the first NALU whose `nal_unit_type` (`byte & 0x1F`) is **1** (non-IDR slice) or **5** (IDR slice) ends the clear header at `startCodePos + startCodeLen + 2`, clamped to the frame length. That keeps the start code, the NALU header byte, and one byte of slice header in the clear.

> **Known limitation.** If no slice NALU is found, `clearBytes` is 0 and escaping is skipped, so the ciphertext may contain false start codes. In practice every encoder-emitted frame contains a slice NALU.

---

## 6. Encode algorithm

```
on frame:
  if frame.payload is empty: forward unchanged
  key, keyIndex, ivPrefix = latestKeyFor(localUserId)
  if no key: drop frame, emit missing_key (throttled); return

  // A key/delta type marks video. Checked before the counter, so a dropped
  // frame costs no IV.
  if profileFor(codec).audioOnly and frame.type is set:
      drop, emit encryption_failed; return

  clearBytes = clearBytesFor(codec, frame.type, frame.data)
  if clearBytes > 0x7FFF: drop, emit encryption_failed; return
  isRbsp     = isH264 && clearBytes > 0
  counter    = nextFrameCounter()                 // may throw at the ceiling
  iv         = ivPrefix || counter
  aad        = frame[0 .. clearBytes)
  ct         = AES-GCM-encrypt(key, iv, aad, frame[clearBytes ..])
  trailer    = writeTrailer(counter, ivPrefix, keyIndex, clearBytes, isRbsp)
  out = isRbsp ? aad || rbspEscape(ct || trailer, seed = trailingZeros(aad, max 2))
               : aad || ct || trailer
  forward out
```

**Fail closed, always.** Any error on the encode path drops the frame. A frame is never forwarded in the clear because encryption failed.

**Unsupported codecs.** A named codec with no clear-byte rule (AV1 today, H.265, anything unrecognized) installs a transform that drops every frame and emits `encryption_failed` once. This is the safety net, not the plan: the SFU must not negotiate AV1 on an encrypted call, because the net costs the track entirely.

## 7. Decode algorithm

The decoder is **codec-agnostic**: the format is self-describing. Do not pass a codec hint to the decode transform.

```
on frame:
  if frame.payload is empty: forward unchanged

  trailer = readTrailer(frame)          // magic == 0xE2EEFEED && version == 1
  if trailer == null:
      // Two different conditions; the frozen suffix (§5.2) tells them apart.
      v = readFramingVersion(frame)     // version byte iff magic matches, else null
      if v != null and v != 1:
          drop, emit unsupported_version(v) (throttled per track); return
      emit unencrypted_frame (throttled); forward unchanged; return
  -> recover ciphertext + IV fields (RBSP path per §5.4)
  -> decode with (keyIndex, ivPrefix, frameCounter)

decode with (keyIndex, ivPrefix, counter):
  key = resolveKey(senderUserId, keyIndex)
  if no key: drop, emit missing_key(keyIndex) (throttled); return
  if not replayWindow.peek(counter, ivPrefix): drop silently; return
  try:
      plaintext = decrypt(...)
      replayWindow.commit(counter, ivPrefix)      // only after authentication
      failures.clearFailures(keyIndex)            // gates `decryption_stalled`, nothing else
      emit decryption_resumed                     // unthrottled and paired; §10
      forward clearHeader || plaintext
  catch:
      if failures.recordFailure(keyIndex) crosses tolerance: emit decryption_stalled
      emit decryption_failed (throttled)
      drop
```

**`readTrailer` validation order:** length >= 20, then `magic == 0xE2EEFEED`, then `version == 1`, then `clearBytes <= frameLength - 20`. Any mismatch means "not a v1 trailer" - never attempt a decrypt.

**An unknown version is not a decryption failure, and not a cleartext frame either.** It gets its own disposition: drop the frame and emit `unsupported_version` carrying the observed version. Dropping rather than forwarding is the point - forwarding hands ciphertext to the decoder, which renders as corruption and reads to the host as a downgrade, when the actual condition is a peer on a newer SDK and the remedy is updating this client. Treating it as a decryption failure would be equally wrong: no key can fix it.

Everything else that fails `readTrailer` (short frame, magic mismatch, `clearBytes` overrunning the body) stays "not ours" and is forwarded as cleartext with `unencrypted_frame`. That is what keeps an unrelated frame which happens to end in `0xE2EEFEED` from producing spurious failures.

The magic is a heuristic, not a guarantee: any 4-byte value collides with random data at 2^-32. `0xE2EEFEED` is chosen to be an unlikely accident rather than a common one - a widespread debug fill such as `0xDEADBEEF` shows up in real buffers far more often than a value nothing else uses. No byte of it is `0x00` or `<= 0x03` either, which is what keeps the start-code-safe trailer tail safe (§5.4).

> **Consequence worth knowing.** The magic still collides with random data at 2^-32, so a cleartext frame can be mistaken for ours. If its version byte happens not to be 1 it is dropped rather than forwarded, at that same rate - no worse than the existing behavior for a collision whose version byte _is_ 1, which reaches a decrypt and fails.

---

## 8. Receiver hardening

### Trust ordering (the SFrame / SRTP rule)

Everything read before the decrypt call (`frameCounter`, `ivPrefix`, `keyIndex`, `clearBytes`, the RBSP flag) is **plaintext and forgeable by a relay**. Nothing may mutate trust state until GCM authenticates the frame.

- The replay window is **peeked** before decrypt and **committed** only after success.
- The failure counter is diagnostic only. It gates the `decryption_stalled` signal; it never gates a decrypt attempt. A burst of forged frames must not be able to latch a genuine key invalid.

### Replay window

Scoped **per remote track**, not per user. Remote tracks travel on independent SSRCs with independent jitter buffers; a shared window would let one track's delivery skew reject the other's frames.

- **Window:** 1024 frames, RFC 6479-style sliding bitmap over the counter.
- **Accept** if the counter is above the high-water mark, or within the window and not already seen. **Reject** if `counter <= highest - 1024` or already seen.
- Rejections are **silent drops**, not decryption failures.
- Within a track, the window is partitioned by **sender `ivPrefix` ("epochs")**. A sender restart or key re-import brings a fresh prefix and a counter that restarts low; a fresh epoch gives it a clean window instead of rejecting it against a stale high-water mark.
- Keep at most **3 epochs**, most-recent first, evicting the oldest. Epochs are created and evicted **only by `commit`**, i.e. only by authenticated frames, so a relay cannot fabricate novel-prefix frames to evict a genuine epoch.

### Failure tolerance

Consecutive decryption failures are counted **per track, per `keyIndex`**. After **10** consecutive failures, the 11th fires `decryption_stalled` exactly once per failure run. A successful decrypt clears the count for that `keyIndex`, and also fires `decryption_resumed` - but keep the two independent. The count gates `decryption_stalled` and nothing else; the recovery is gated separately, on whether a failure was ever delivered to the host (§10).

Per-track scoping is load-bearing: a counter shared across a user's tracks lets one track's healthy frames reset another's failures, so the threshold is never crossed and `decryption_stalled` can never fire.

### Throttling

The _level_ notifications (`missing_key`, `decryption_failed`, `unencrypted_frame`) are throttled to **at most one per second** per key (per user, or per keyIndex where noted), so a sustained failure cannot flood the host.

`decryption_resumed` is an _edge_ and is **never throttled** - throttling it would drop a state transition permanently. It is bounded by pairing instead: it is emitted only for a failure that actually reached the host, and those are throttled. See §10.

---

## 9. Counter exhaustion

The counter is a 32-bit IV field and **must never wrap**: a wrap folds into a previously used `(ivPrefix, counter)` pair, which is catastrophic under AES-GCM (Appendix A.1).

> **The five rules.** This is the whole contract; Appendix A carries the reasoning.
>
> 1. **One counter per manager**, shared across every track and codec. Hold it as a single value, never a map keyed by user id - a wrong or changed id would hand out a fresh counter starting at 1 under the same key and prefix.
> 2. **Check before incrementing**, and never store a value past the ceiling.
> 3. **Never reset it on a key operation.** `setKey`, `setSharedKey`, `removeKeys` and `removeSharedKey` all leave it untouched; only a new manager starts at 0.
> 4. **Throw at the ceiling.** The frame is dropped and `encryption_failed` is emitted. This is the only counter threshold; nothing fires below it.
> 5. **Fresh 8-byte `ivPrefix` from a cryptographic RNG on every key import.** Never derived from a user id, session id, timestamp or counter; never reused across imports; never shortened.

```
c = counter + 1
if c > 0xFFFFFFFF:
    throw            # do NOT store c: the counter stays pinned at the ceiling
counter = c
```

Rules 1 and 5 are two independent guards, covering two different scopes (§4). Resetting the counter on import, as rule 3 forbids, collapses them into one.

| Action                           | Frame counter           | `ivPrefix`                |
| -------------------------------- | ----------------------- | ------------------------- |
| `setKey` / `setSharedKey`        | unchanged, keeps rising | fresh random for the slot |
| `removeKeys` / `removeSharedKey` | unchanged, keeps rising | dropped with the slot     |
| new manager                      | reset to 0              | -                         |

Key state per action is §3; this table covers only the counter and the prefix.

**Recovery is a new manager, and the error message must say so.** A rotation gives a disjoint IV space but not a fresh budget, and an exhausted counter does not advance, so a rekeyed track fails identically and publishes nothing for the rest of the manager's life. An error naming rekeying sends integrators down a path that cannot work. `encryption_failed` is latched per track, so the host sees one event per track and then silence rather than a per-frame flood.

**No early-warning signal below the ceiling.** The budget is roughly a year of continuous publishing (Appendix A.3), and no rotation can restore it, so a warning would fire once, months in, naming no remedy.

---

## 10. Events

Event names are listed below unprefixed. On the wire and in the JS API they carry an `e2ee.` prefix (`e2ee.missing_key`, `e2ee.decryption_stalled`, ...); keep that convention so E2EE events stay distinguishable from SFU and coordinator events.

| Event                           | Payload                           | Fires when                                                                                       | Host action                                                                   |
| ------------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `missing_key` (no `keyIndex`)   | `userId`                          | encoder has no local key; **every outgoing track is dropped**                                    | provide a key                                                                 |
| `missing_key` (with `keyIndex`) | `userId`, `keyIndex`, `trackType` | a remote frame referenced a key this peer does not hold                                          | usually benign: key distribution or rotation in flight                        |
| `decryption_failed`             | `userId`, `trackType`             | GCM tag failure on a remote frame                                                                | key mismatch, rotation, or tampering                                          |
| `decryption_resumed`            | `userId`, `trackType`             | that track decrypts again                                                                        | clear the warning raised by `decryption_failed`                               |
| `encryption_failed`             | `userId`, `trackType`, `reason`   | an outgoing frame could not be encrypted                                                         | that track is publishing nothing                                              |
| `decryption_stalled`            | `userId`, `keyIndex`, `trackType` | 10+ consecutive failures for `(track, keyIndex)`                                                 | surface to the user; redistribute keys                                        |
| `unencrypted_frame`             | `userId`, `trackType`             | a remote frame carried no E2EE framing and was forwarded as-is                                   | expected when the call's mode allows plain publishers; otherwise a downgrade  |
| `unsupported_version`           | `userId`, `version`, `trackType`  | a remote frame carried our framing at a version this build cannot read; **the frame is dropped** | prompt the local user to update **this** app, not the peer; no key can fix it |
| `perf_report`                   | per-track encode/decode samples   | once per second when perf reporting is on                                                        | diagnostics                                                                   |
| `key_state`                     | `KeyStateReport`                  | in response to `requestKeyState`                                                                 | diagnostics                                                                   |

`missing_key` is deliberately distinct from `decryption_failed`: a host cannot otherwise tell "key not here yet" from "key mismatch or tampering".

### Rules for emitting these

**Carry `trackType` on anything reported per track.** Every event above except the encode-side `missing_key` is raised inside one track's transform, so without it a peer's audio, video and screen share produce byte-identical messages the host cannot tell apart or act on. The encode-side `missing_key` is the one genuine exception: the local user holds no key at all, which stalls every outgoing track at once, so it is reported once for the user and carries no track.

**Levels may be throttled; edges may not.** `decryption_failed`, `missing_key`, `unencrypted_frame` and `unsupported_version` are _levels_ - they describe a condition that persists, so throttling them to one per second per track is safe, because the next frame re-raises the same condition.

`decryption_resumed` is an _edge_. Throttling it drops a state transition permanently and strands the host on `decryption_failed` for a track that has recovered. Emit it **unthrottled**, paired one-to-one with delivered failures:

```
on decryption failure:
    if failureThrottle.tryFire():
        failureReported = true
        emit decryption_failed

on successful decrypt:
    clear the per-keyIndex failure count      # gates `decryption_stalled`
    if failureReported:                       # gates `resumed`
        failureReported = false
        emit decryption_resumed
```

Pairing bounds the rate for free: a recovery can only be emitted for a failure that was emitted, and those are throttled. Two details follow from it, and both are load-bearing:

- Do **not** gate the recovery on the failing `keyIndex`'s own count. `decryption_failed` names a track, not a key epoch, so a track that recovers by rotating to a **new** `keyIndex` must still clear it - otherwise the host stays latched on failed forever.
- Do **not** emit a recovery for a failure that was throttled away. The host never heard about it, so there is nothing to clear.

**`encryption_failed` is latched per track**, re-arming when a frame encrypts again. A permanently dead track therefore reports once, not once per frame.

`key_state` returns per-user and shared keys with their **fingerprints only** (hex of the first 8 bytes of `SHA-256(rawKey)`). Raw key material must never leave the worker. At most one shared entry has `isActive: true`, and all of them being inactive is a valid state (§3).

---

## 11. Conformance test vectors

All vectors use:

- key = `000102030405060708090a0b0c0d0e0f` (AES-128-GCM)
- `keyIndex` = 0
- `frameCounter` = 1

All vectors use `ivPrefix` = `1111111111111111`.

**Opus** (audio frame, `clearBytes` = 1)

```
in   78aabbccdd
out  78
     d02bf795e85c0bed034f7b282ca617cf76d57eb0     <- ciphertext + tag
     00000001 1111111111111111 00 0001 01 e2eefeed
```

**VP8 keyframe** (`clearBytes` = 10)

```
in   10111213141516171819aabb
out  10111213141516171819
     d02b0484ce4aa2b21a4a83cbfe2ed6511c68
     00000001 1111111111111111 00 000a 01 e2eefeed
```

**H.264 IDR** (`clearBytes` = 6, RBSP path; note `0x03` inserted before the counter, and `clearBytes` encoded as `0x8006`)

```
in   00000001 65 8884deadbe
out  000000016588
     fe4e96f631df11f57a43ed2003eaad0c5d6db632     <- ciphertext + tag
     0000030001 1111111111111111 00 8006 01 e2eefeed   <- escaped trailer
```

A new implementation is conformant when it reproduces the bytes above exactly, decrypts them back to the inputs, and handles both fail-closed cases. All three vectors were regenerated from the reference implementation and verified to round-trip.

---

## 12. Versioning rules

- Bump `version` only when the trailer layout or IV derivation changes, and only in lockstep across SDKs.
- Any change to the AAD composition, the clear-byte rules, or the escaping rules is a wire break and requires a version bump plus new vectors in §11.

### Forward compatibility

Lockstep releases do not give lockstep deployment: SDKs ship inside apps, app versions live in stores for months, and a participant on an old build will join a call with a new one. Version skew is therefore a state to be **detected**, not one that policy can prevent. Two commitments make it detectable, and both must be implemented in v1, before any v2 exists - a v1 receiver that ships without them cannot be fixed retroactively when v2 arrives.

1. **The identification suffix never moves.** The last 5 bytes of every frame, in every version, are `version ∥ magic`, read relative to the end of the frame, with the byte 6 from the end never `0x00` (§5.2). A future version may change everything else in the trailer, including its length.
2. **An unrecognized version is reported as itself.** Drop the frame and emit `unsupported_version` with the observed version (§7, §10). Never forward it as cleartext, and never report it as a decryption failure.

Together these turn skew from corrupt media that looks like a downgrade into an actionable "update this app". Note the direction: the peer wrote a format newer than this receiver implements, so the **local** client is the one to update - reporting it against the remote participant, whose build is already current, is the easy mistake to make here. Detection is receive-side only, which lands the signal in the right place for exactly that reason: the client that must update is the one that notices. It is a diagnostic, not a security control - a relay forging `version = 99` to force drops achieves nothing it could not achieve by discarding the frames itself.

The complete fix is to negotiate a call-level maximum version at join, so a newer client emits older framing while any older participant is present. That is out of scope here; the suffix commitment is what keeps the un-negotiated case legible.

---

## 13. Platform notes and open items

- **Transform API (web only):** Chrome ships `RTCRtpScriptTransform` but it is still unreliable for E2EE, so the JS SDK puts Chrome on the legacy Insertable Streams path (`createEncodedStreams`, which additionally requires the non-standard `encodedInsertableStreams` flag on the `RTCPeerConnection`). Firefox and Safari always use `RTCRtpScriptTransform`. The selection is not configurable. Native SDKs have their own frame-transformer hooks and can ignore this.
- **Key exchange is out of scope.** The SDK transports frames; the host owns key derivation, distribution and rotation.
- **RED (audio redundancy)** is applied by the packetizer, after the encode transform, so it does not affect this format.
- **H.264 with no slice NALU** falls back to whole-frame encryption without escaping (§5.4). Flag if any platform's encoder can actually produce this.
- **AV1 is out of scope for the initial release** (§1). The SFU must not negotiate it on an encrypted call; the client-side fail-closed is a net, not a fallback. Adding it later means a second framing scheme, a new version number, and new vectors.

---

## Appendix A: why

Reference material behind the IV rules in §4 and §9. Nothing here is normative - it is here so that an implementer who wants to know why the rules take this shape, or who is tempted to relax one, does not have to re-derive it.

### A.1 Why IV reuse is catastrophic, not merely a leak

GCM is CTR mode plus GHASH, and a repeated IV breaks both halves.

The keystream is a function of `(key, IV)` alone, so two frames encrypted under the same one give `C1 ⊕ C2 = P1 ⊕ P2`: the keystream cancels and the plaintexts leak against each other. Video frames are highly correlated and partly predictable, so that XOR is close to recovering both.

The authentication failure is worse. The tag is `GHASH_H(A, C) ⊕ E_K(J0)`, and `J0` derives from the IV, so on a collision the `E_K(J0)` mask cancels too: `T1 ⊕ T2` leaves a polynomial whose only unknown is the GHASH subkey `H`. Solving it recovers `H`, and an attacker holding `H` can forge a valid tag for **any** frame under that key, not only the two that collided. This is the "forbidden attack", demonstrated in practice against TLS stacks that repeated a nonce.

A counter wrap is the guaranteed form of it: `ivPrefix` is fixed for the lifetime of an import, so the IV is a pure function of the counter, and wrapping replays the entire IV sequence in order.

### A.2 Why the random `ivPrefix` carries the between-sender case

The counter separates IVs only _within_ one sender. Between senders it contributes nothing, and under a shared key that is exactly the case that matters: every participant holds the same AES key, and every participant's counter independently starts at 0, so A's first frame uses `P_A ∥ 1` and B's uses `P_B ∥ 1`. Only `P_A != P_B` keeps them apart.

With 8 random bytes the collision probability across _n_ participants is about `n² / 2^65` (~3e-16 for 100 participants), which is why 64 bits suffice - and why the prefix has to be a full 8 bytes of cryptographic randomness, fresh on every import. Deriving it from a user id, session id, timestamp or counter, reusing one across imports, or shortening it breaks AES-GCM for the whole call. This is the single easiest thing to get wrong when porting.

### A.3 How long is the budget?

The counter is shared across **all** of a sender's tracks, so the aggregate frame rate is what matters:

```
months ≈ 2^32 / (aggregate frames per second) / 2.6e6
```

Worked example, a typical camera call: Opus at 20 ms ptime contributes 50 fps, and a 30 fps camera track with 3 simulcast layers contributes 90 fps (each layer's frames traverse the transform separately), so ~140 fps aggregate.

| Case                                     | Aggregate | Hard stop at 2^32 |
| ---------------------------------------- | --------- | ----------------- |
| Camera + mic, 3 simulcast layers         | ~140 fps  | **~12 months**    |
| Camera + mic, single stream (SVC, 1 rid) | ~80 fps   | ~20 months        |

That is continuous publishing within a single session, and the counter resets with each new manager, so no real call approaches it. The ceiling is a correctness guard, not an operational event.
