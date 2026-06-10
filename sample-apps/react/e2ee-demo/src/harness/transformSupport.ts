import { EncryptionManager } from '@stream-io/video-react-sdk';
import type { TransformPath } from './snapshot';

export interface TransformSupport {
  /** The transform path the SDK would attach by default here, if any. */
  recommended: TransformPath | undefined;
  /** Whether the legacy Insertable Streams (`createEncodedStreams`) API exists. */
  hasInsertableStreams: boolean;
  /** Whether the standard `RTCRtpScriptTransform` API exists. */
  hasScriptTransform: boolean;
}

/** Human-readable label for each transform path. */
export const transformLabels: Record<TransformPath, string> = {
  insertable: 'Insertable Streams',
  script: 'RTCRtpScriptTransform',
};

/**
 * Feature-detect which Encoded Transform APIs the current browser exposes and
 * which one the SDK would pick by default.
 *
 * The recommendation comes from {@link EncryptionManager.preferredTransform} -
 * the SDK's own selection policy - so the harness never drifts from the real
 * runtime behavior. The per-API capability flags are plain global checks, used
 * only to annotate the UI (e.g. flag an option that would silently fall back).
 */
export const detectTransformSupport = (): TransformSupport => ({
  recommended: EncryptionManager.preferredTransform(),
  hasInsertableStreams:
    typeof RTCRtpSender !== 'undefined' &&
    'createEncodedStreams' in RTCRtpSender.prototype,
  hasScriptTransform: typeof RTCRtpScriptTransform !== 'undefined',
});
