# AV1 E2EE wire format design

- Status: draft for review
- Date: 2026-06-05
- Scope: `packages/client/src/rtc/e2ee` (encode/decode worker, wire format)
- Related: existing v2 partial-frame format (`e2ee-worker/`), DD-based SFU routing

## Problem

The current E2EE scheme (`v2`) encrypts the body of an encoded frame, leaves a
codec-specific clear prefix at the front, and appends a 20-byte trailer. It
supports Opus, VP8, VP9, and H.264. AV1 is explicitly rejected
(`EncryptionManager.ts`, `e2ee-worker-impl.ts`).

AV1 cannot reuse the v2 approach for two structural reasons:

1. **The sender's RTP packetizer parses the frame.** `RtpPacketizerAv1::ParseObus`
   walks the OBU structure (OBU header + `obu_size`) of the frame _after_ our
   encode transform runs. Appending a v2-style trailer adds non-OBU bytes after
   the last OBU; `ParseObus` would try to parse them as an OBU header and
   corrupt packetization. The receiver's `VideoRtpDepacketizerAv1` likewise
   reassembles OBUs and recomputes `obu_size`/sizes. So **every byte we add must
   live inside a valid, size-correct OBU** - no trailing bytes.

2. **SVC layer dropping.** AV1 is used in Stream for SVC. With the Dependency
   Descriptor (DD) RTP header extension, the SFU forwards only a subset of
   spatial/temporal layers by dropping whole OBUs in transit. A receiver may see
   fewer tile-group OBUs than the sender encrypted, so a segment's crypto
   identity must derive from a _drop-stable_ value (its layer id), never from
   positional order.

The SFU already routes AV1 correctly off DD and does not need the OBU payload,
so the SFU side requires no changes. This design is client-side plus a
cross-SDK wire contract.

## Release status and versioning

None of the E2EE code has been released publicly yet (it lives on an unmerged
branch), so there is no backward compatibility to preserve and no "old client"
population to degrade for. The trailer scheme (Opus/VP8/VP9/H.264) and this
inline-OBU scheme (AV1) are NOT sequential versions where one supersedes the
other - they are two per-codec formats that co-ship in the first release and
coexist _at runtime_ (a single call carries both when participants publish
different codecs, so the decoder must tell them apart). The `version` byte is a
format discriminator and a cheap forward-looking evolution hook for after
release; it is not a cross-release compatibility boundary today. Names and
numbers are free to change before release. The labels `v2` (trailer) and `v3`
(AV1 inline) below are just identifiers for the two formats, not a version
ladder.

## Confirmed decisions

| Decision              | Choice                                                                                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SVC layer dropping    | In scope - full spatial + temporal                                                                                                                               |
| Format coexistence    | Trailer (other codecs) and inline-OBU (AV1) co-ship and are distinguished at runtime by the version byte; nothing released, so no compat to preserve (see above) |
| Per-OBU IV uniqueness | XOR a layer-derived salt into the IV prefix                                                                                                                      |
| Metadata home         | Inline per encrypted OBU (no trailer); rewrite `obu_size`                                                                                                        |
| Encrypted OBU types   | `OBU_TILE_GROUP` (4) and `OBU_FRAME` (6) payloads only                                                                                                           |

## Wire format (v3)

### OBU classification

- **Encrypt the payload of:** `OBU_FRAME` (type 6), `OBU_TILE_GROUP` (type 4).
- **Copy verbatim:** temporal delimiter (2), sequence header (1), frame header
  (3), metadata (5), redundant frame header (7), tile list (8), padding (15),
  and any other type.

Cross-SDK rule: _"encrypt the payload of OBU types 4 and 6; copy everything else
verbatim."_

Open sub-choice (recommended NO for v1): also encrypting sequence/frame-header
OBUs for resolution confidentiality. Rejected for v1 - resolution is already
inferable from bitrate, and the {4,6}-only rule keeps the walk trivial.

### Per-encrypted-OBU layout

An encrypted OBU changes from `[obu_header][obu_size][payload]` to:

```
[obu_header (1-2B, clear, in AAD)]
[obu_size   (LEB128, clear, rewritten to cover the new payload)]
[inline_header (18B, clear, in AAD):
    magic     4B
    version   1B   (= 3)
    keyIndex  1B
    ivPrefix  8B
    frameSeq  4B   (big-endian)
]
[ciphertext(L) ‖ GCM tag(16)]   = L + 16 bytes
```

- `obu_size` now encodes `18 + L + 16`. The LEB128 length may change (e.g. a
  payload crossing a 7-bit boundary); the walker re-encodes it.
- WebCrypto `encrypt()` returns `ciphertext ‖ tag` concatenated, so inline tag
  placement is free on the JS side. Other SDKs concatenate to match.
- Frame-global fields (`magic`, `version`, `keyIndex`, `ivPrefix`, `frameSeq`)
  repeat per encrypted OBU so **each OBU is self-describing** - this is what
  makes SVC drop-resilience fall out for free.

Overhead: 34 B per encrypted OBU (18 header + 16 tag). ~100 B for a 3-layer SVC
frame.

Deferred optimization (NOT in v1): SVC guarantees the base layer (S0,T0) is in
every forwarded subset, so the frame-global fields could be stored once in the
base OBU and enhancement OBUs trimmed to `[ciphertext ‖ tag]`. Kept out of v1 to
keep the first cross-SDK contract simple and each OBU independent.

### Layer id and salt

Read from the clear OBU bytes the walker already parses:

- `obu_extension_flag == 1` -> extension byte gives `temporal_id` (bits 7-5) and
  `spatial_id` (bits 4-3). Flag 0 -> both 0 (base layer).
- `tileIdx`: the n-th encrypted OBU sharing the same `(spatial_id, temporal_id)`
  within the temporal unit. Re-derived identically on both sides by walking
  same-layer OBUs in order. Stable under dropping because the SFU drops whole
  layers, never an individual tile within a layer.

```
salt16 = (spatial_id << 14) | (temporal_id << 11) | (tileIdx & 0x07FF)
              2 bits             3 bits               11 bits
```

### IV derivation

```
saltedPrefix      = ivPrefix.copy()         // 8-byte sender prefix
saltedPrefix[6]  ^= (salt16 >> 8) & 0xFF
saltedPrefix[7]  ^=  salt16       & 0xFF
IV (12B)          = saltedPrefix(8) ‖ frameSeq(4)   // frameSeq big-endian
```

- `frameSeq`: one `nextFrameCounter(userId)` tick per _temporal unit_, shared by
  every encrypted OBU in the frame. Same monotonic per-user counter as v2;
  replay window keeps 1-tick-per-frame semantics.
- Base layer `(S0,T0,tile0)` -> `salt16 == 0` -> IV is byte-identical to the v2
  construction. The crypto core needs only a salt-XOR variant; single-stream AV1
  degenerates to today's path.

**Uniqueness.** Any two IVs with different salts differ in the prefix bytes (XOR
by distinct values) and can never collide regardless of `frameSeq`. Any two with
the same salt need the same `frameSeq` to collide - impossible, since `frameSeq`
is globally monotonic per user. Other-codec tracks on the same key use salt 0
and draw from the same counter, so their `frameSeq` never coincides with an AV1
frame's; AV1 enhancement layers (salt != 0) occupy a prefix space those codecs
never touch. AES-GCM requires IV uniqueness, not randomness, so a deterministic
salt is sound; the random prefix remains for cross-session reuse defense.

### AAD

```
AAD = obu_header(1B) [+ obu_extension_header(1B if present)]   // copied verbatim by libwebrtc
    ++ inline_header(18B)                                       // we control it, clear, pre-ciphertext
```

- OBU header + extension byte are byte-stable across packetize/depacketize (the
  depacketizer copies `obu_header` verbatim). Binding them authenticates the OBU
  type and the layer id the salt is derived from.
- `obu_size` is **excluded** - libwebrtc rewrites it, so it is not stable and
  would fail GCM every frame.
- The inline header is included so `keyIndex`/`ivPrefix`/`frameSeq` cannot be
  tampered to redirect decryption.
- `tileIdx` is never on the wire; a mismatch just yields the wrong IV -> clean
  decrypt failure.

## Encode flow (sender)

Existing gates unchanged: `e2eeActive`, empty-frame passthrough, missing-key ->
`notifyMissingKey` + drop.

1. `frameSeq = nextFrameCounter(userId)` - once per frame (fail-closed at 2^32).
2. Walk OBUs: `obu_header` -> `obu_extension_header` (if flag) -> `obu_size`
   (LEB128) -> payload.
3. For each type-{4,6} OBU: derive `(spatial_id, temporal_id)` + running
   `tileIdx`; build IV; `inline_header`; `AAD = headerBytes ++ inline_header`;
   `cipher = encrypt(IV, key, AAD, payload)` (L+16); new payload =
   `inline_header ++ cipher`; rewrite `obu_size`; emit.
4. Every other OBU: emit verbatim. Concatenate -> `frame.data`. No trailer.
5. Per-OBU encrypts run concurrently within the single `transform()` call
   (`Promise.all`); the TransformStream serializes frames, so ordering holds.
6. Zero encryptable OBUs (no coded pixel data) -> frame emitted unchanged;
   benign.

## Decode flow (receiver)

1. Walk OBUs. The frame is ours iff some type-{4,6} OBU's payload starts with
   `magic` + `version == 3`. None -> passthrough untouched (today's no-trailer
   behavior).
2. Read frame-global fields from the first encrypted OBU. `isKeyInvalid` /
   `getKey` / `replay.check(frameSeq, ivPrefix)` - once per frame, all existing
   machinery.
3. For each encrypted {4,6} OBU: re-derive salt -> IV; `AAD` from received header
   bytes + inline header; `decrypt(payload[18:])` -> L plaintext; rewrite
   `obu_size` to L; emit. Others verbatim.
4. **Any segment's GCM tag failure drops the whole frame** (fail-closed) and
   feeds the existing failure-tolerance / `e2ee.broken` /
   `e2ee.decryption_resumed` path. Never emit a partially decrypted frame.

## Edge cases

- **Encryption toggled mid-call** - per-frame magic detection handles the mixed
  window, same as v2.
- **`obu_has_size_field == 0`** - WebRTC's libaom output sets it; guard by
  bailing with `signalEncodeFailure` rather than guessing OBU boundaries.
  (Verify item, below.)
- **First-encrypted-OBU absent** - SVC guarantees the base layer is forwarded;
  every encrypted OBU is self-describing, so we use the first present. Truly
  absent -> drop + notify.
- **No {4,6} OBUs** - emitted clear; nothing to protect.
- **`tileIdx` agreement** - dropping removes whole layers, never reorders within
  a layer, so per-layer ordinals match on both sides.
- **Magic false positive** - a real payload opening with `magic`+`ver==3`
  (~1 in 2^40) -> one GCM failure -> one dropped frame. Same risk class as v2.

## Cross-SDK contract (for iOS / Android)

1. Encrypt only OBU types {4, 6}; copy all other OBUs verbatim.
2. Inline-header layout, field widths, magic constant, version = 3.
3. `obu_size` LEB128 rewrite on encrypt (cover inline header + ciphertext + tag)
   and restore on decrypt.
4. Salt bit-packing (2/3/11) XORed into prefix bytes [6], [7].
5. `IV = (ivPrefix XOR salt) ‖ frameSeq` (big-endian frameSeq, as v2).
6. One monotonic per-user counter tick per temporal unit, shared across the
   user's tracks/codecs; same counter source as v2.
7. `AAD = headerBytes ++ inline_header`; `obu_size` excluded.
8. Replay check once per frame on `frameSeq`.
9. Whole-frame drop on any segment auth failure.
10. Detection: frame is encrypted iff a {4,6} OBU's payload begins with
    magic + version.

The enforcement artifact is a shared golden-vector file (below); all three SDKs
must produce byte-identical output for the same inputs.

## Testing

- **Unit (vitest):** OBU walker round-trip (extension headers, LEB128
  length-boundary cases such as L=112 -> 128); IV-uniqueness property test across
  layers/frames; AAD round-trip; magic detection; `obu_size` rewrite across
  LEB128 length boundaries.
- **Integration:** encode -> decode restores original bytes exactly for {4,6}
  OBUs; SVC drop sim (drop a middle enhancement OBU, assert the rest decrypts);
  tampered extension header -> fail; wrong key -> fail-closed; disabled ->
  passthrough.
- **Cross-SDK golden vectors:** `(rawKey, ivPrefix, frameSeq, input OBU stream)
-> expected encrypted bytes`, shared so JS/iOS/Android match byte-for-byte.
- **Validate-via-tutorial-first:** a manual "AV1 E2EE" toggle in a sample app +
  packet capture through the real SFU, before any auto-behavior lands in the
  package.

## Open verification items (before/while implementing)

1. Confirm WebRTC's libaom output has `obu_has_size_field == 1` on the frames our
   encode transform receives (the encode walk assumes it; reference the
   `GetStream/webrtc` fork).
2. Packet-capture confirmation that tile-group/frame OBU _payload_ bytes are
   round-trip byte-exact through `RtpPacketizerAv1` -> SFU -> `VideoRtpDepacketizerAv1`
   (we rely on libwebrtc rewriting framing only, not payload).
3. RESOLVED: the decode transform stays codec-blind. It tries the v2 trailer
   first (`readTrailer`); if absent, it defensively parses OBUs and treats the
   frame as AV1-v3 iff the first coded-data OBU's payload begins with
   magic+version. `decrypt(receiver, userId)` needs no codec argument, so the
   Subscriber is untouched. `parseObus` must be defensive (return null on
   malformed input) so non-AV1 unencrypted frames fall through to passthrough.

## Files in scope

- `packages/client/src/rtc/e2ee/EncryptionManager.ts` - remove AV1 throw.
- `packages/client/src/rtc/e2ee/e2ee-worker/e2ee-worker-impl.ts` - remove AV1
  block; multi-segment encode/decode walk.
- `packages/client/src/rtc/e2ee/e2ee-worker/codec.ts` - OBU walker, salt packing,
  `obu_size` (LEB128) read/write; add `av1` to supported codecs.
- `packages/client/src/rtc/e2ee/e2ee-worker/crypto.ts` - salt-XOR IV variant
  (`fillIV`).
- `packages/client/src/rtc/e2ee/e2ee-worker/constants.ts` /
  `types.ts` / `utils.ts` - v3 constants, inline-header read/write.
- Tests under `packages/client/src/rtc/e2ee/__tests__/`.

The IV/counter/key/replay/keystore machinery is codec-agnostic and unchanged
apart from the salt-XOR IV variant.
