import type { TransformMode } from './snapshot';

export interface TransformSupport {
  /** Whether the legacy Insertable Streams (`createEncodedStreams`) API exists. */
  hasInsertableStreams: boolean;
  /** Whether the standard `RTCRtpScriptTransform` API exists. */
  hasScriptTransform: boolean;
}

/** Human-readable label for each transform mode. */
export const transformLabels: Record<TransformMode, string> = {
  auto: 'auto (SDK picks)',
  'force-script': 'force RTCRtpScriptTransform',
};

/**
 * Feature-detect which Encoded Transform APIs the current browser exposes.
 *
 * Which one the SDK actually attaches is its own business (Chrome prefers the
 * legacy Insertable Streams path, everything else uses `RTCRtpScriptTransform`),
 * and it deliberately isn't public API - so the harness reports raw capabilities
 * rather than second-guessing the selection and drifting from it.
 */
export const detectTransformSupport = (): TransformSupport => ({
  hasInsertableStreams:
    typeof RTCRtpSender !== 'undefined' &&
    'createEncodedStreams' in RTCRtpSender.prototype,
  hasScriptTransform: typeof RTCRtpScriptTransform !== 'undefined',
});
