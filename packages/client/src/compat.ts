// Deprecated aliases for coordinator types renamed by @stream-io/openapi-clientside.
import type {
  CoordinatesResponse,
  ICEServerResponse,
  LocationResponse,
  SendVideoReactionRequest,
  SendVideoReactionResponse,
  SIPChallengeRequest,
  WSEvent,
} from './gen/coordinator';

/** @deprecated renamed to `SendVideoReactionRequest` */
export type SendReactionRequest = SendVideoReactionRequest;
/** @deprecated renamed to `SendVideoReactionResponse` */
export type SendReactionResponse = SendVideoReactionResponse;
/** @deprecated renamed to `WSEvent` (now also includes chat/feeds events) */
export type VideoEvent = WSEvent;
/** @deprecated renamed to `ICEServerResponse` */
export type ICEServer = ICEServerResponse;
/** @deprecated renamed to `CoordinatesResponse` */
export type Coordinates = CoordinatesResponse;
/** @deprecated renamed to `LocationResponse` */
export type Location = LocationResponse;
/** @deprecated renamed to `SIPChallengeRequest` */
export type SIPChallenge = SIPChallengeRequest;

// Enum objects that the coordinator models exported before the v2 migration.
// The generator now inlines enums (extract_enums=false), so these are
// re-declared here to preserve the public API for existing consumers.
export const AudioSettingsRequestDefaultDeviceEnum = {
  SPEAKER: 'speaker',
  EARPIECE: 'earpiece',
} as const;
export type AudioSettingsRequestDefaultDeviceEnum =
  (typeof AudioSettingsRequestDefaultDeviceEnum)[keyof typeof AudioSettingsRequestDefaultDeviceEnum];

export const AudioSettingsResponseDefaultDeviceEnum = {
  SPEAKER: 'speaker',
  EARPIECE: 'earpiece',
} as const;
export type AudioSettingsResponseDefaultDeviceEnum =
  (typeof AudioSettingsResponseDefaultDeviceEnum)[keyof typeof AudioSettingsResponseDefaultDeviceEnum];

export const CallRecordingFailedEventRecordingTypeEnum = {
  COMPOSITE: 'composite',
  INDIVIDUAL: 'individual',
  RAW: 'raw',
} as const;
export type CallRecordingFailedEventRecordingTypeEnum =
  (typeof CallRecordingFailedEventRecordingTypeEnum)[keyof typeof CallRecordingFailedEventRecordingTypeEnum];

export const CallRecordingReadyEventRecordingTypeEnum = {
  COMPOSITE: 'composite',
  INDIVIDUAL: 'individual',
  RAW: 'raw',
} as const;
export type CallRecordingReadyEventRecordingTypeEnum =
  (typeof CallRecordingReadyEventRecordingTypeEnum)[keyof typeof CallRecordingReadyEventRecordingTypeEnum];

export const CallRecordingStartedEventRecordingTypeEnum = {
  COMPOSITE: 'composite',
  INDIVIDUAL: 'individual',
  RAW: 'raw',
} as const;
export type CallRecordingStartedEventRecordingTypeEnum =
  (typeof CallRecordingStartedEventRecordingTypeEnum)[keyof typeof CallRecordingStartedEventRecordingTypeEnum];

export const CallRecordingStoppedEventRecordingTypeEnum = {
  COMPOSITE: 'composite',
  INDIVIDUAL: 'individual',
  RAW: 'raw',
} as const;
export type CallRecordingStoppedEventRecordingTypeEnum =
  (typeof CallRecordingStoppedEventRecordingTypeEnum)[keyof typeof CallRecordingStoppedEventRecordingTypeEnum];

export const CreateDeviceRequestPushProviderEnum = {
  FIREBASE: 'firebase',
  APN: 'apn',
  HUAWEI: 'huawei',
  XIAOMI: 'xiaomi',
} as const;
export type CreateDeviceRequestPushProviderEnum =
  (typeof CreateDeviceRequestPushProviderEnum)[keyof typeof CreateDeviceRequestPushProviderEnum];

export const FrameRecordingSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type FrameRecordingSettingsRequestModeEnum =
  (typeof FrameRecordingSettingsRequestModeEnum)[keyof typeof FrameRecordingSettingsRequestModeEnum];

export const FrameRecordingSettingsRequestQualityEnum = {
  _360P: '360p',
  _480P: '480p',
  _720P: '720p',
  _1080P: '1080p',
  _1440P: '1440p',
} as const;
export type FrameRecordingSettingsRequestQualityEnum =
  (typeof FrameRecordingSettingsRequestQualityEnum)[keyof typeof FrameRecordingSettingsRequestQualityEnum];

export const FrameRecordingSettingsResponseModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type FrameRecordingSettingsResponseModeEnum =
  (typeof FrameRecordingSettingsResponseModeEnum)[keyof typeof FrameRecordingSettingsResponseModeEnum];

export const IndividualRecordingSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type IndividualRecordingSettingsRequestModeEnum =
  (typeof IndividualRecordingSettingsRequestModeEnum)[keyof typeof IndividualRecordingSettingsRequestModeEnum];

export const IndividualRecordingSettingsResponseModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type IndividualRecordingSettingsResponseModeEnum =
  (typeof IndividualRecordingSettingsResponseModeEnum)[keyof typeof IndividualRecordingSettingsResponseModeEnum];

export const IngressAudioEncodingOptionsRequestChannelsEnum = {
  NUMBER_1: 1,
  NUMBER_2: 2,
} as const;
export type IngressAudioEncodingOptionsRequestChannelsEnum =
  (typeof IngressAudioEncodingOptionsRequestChannelsEnum)[keyof typeof IngressAudioEncodingOptionsRequestChannelsEnum];

export const IngressSourceRequestFpsEnum = {
  NUMBER_30: 30,
  NUMBER_60: 60,
} as const;
export type IngressSourceRequestFpsEnum =
  (typeof IngressSourceRequestFpsEnum)[keyof typeof IngressSourceRequestFpsEnum];

export const IngressVideoLayerRequestCodecEnum = {
  H264: 'h264',
  VP8: 'vp8',
} as const;
export type IngressVideoLayerRequestCodecEnum =
  (typeof IngressVideoLayerRequestCodecEnum)[keyof typeof IngressVideoLayerRequestCodecEnum];

export const LayoutSettingsRequestNameEnum = {
  SPOTLIGHT: 'spotlight',
  GRID: 'grid',
  SINGLE_PARTICIPANT: 'single-participant',
  MOBILE: 'mobile',
  CUSTOM: 'custom',
} as const;
export type LayoutSettingsRequestNameEnum =
  (typeof LayoutSettingsRequestNameEnum)[keyof typeof LayoutSettingsRequestNameEnum];

export const NoiseCancellationSettingsModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type NoiseCancellationSettingsModeEnum =
  (typeof NoiseCancellationSettingsModeEnum)[keyof typeof NoiseCancellationSettingsModeEnum];

export const RTMPBroadcastRequestQualityEnum = {
  _360P: '360p',
  _480P: '480p',
  _720P: '720p',
  _1080P: '1080p',
  _1440P: '1440p',
  PORTRAIT_360X640: 'portrait-360x640',
  PORTRAIT_480X854: 'portrait-480x854',
  PORTRAIT_720X1280: 'portrait-720x1280',
  PORTRAIT_1080X1920: 'portrait-1080x1920',
  PORTRAIT_1440X2560: 'portrait-1440x2560',
} as const;
export type RTMPBroadcastRequestQualityEnum =
  (typeof RTMPBroadcastRequestQualityEnum)[keyof typeof RTMPBroadcastRequestQualityEnum];

export const RTMPSettingsRequestQualityEnum = {
  _360P: '360p',
  _480P: '480p',
  _720P: '720p',
  _1080P: '1080p',
  _1440P: '1440p',
  PORTRAIT_360X640: 'portrait-360x640',
  PORTRAIT_480X854: 'portrait-480x854',
  PORTRAIT_720X1280: 'portrait-720x1280',
  PORTRAIT_1080X1920: 'portrait-1080x1920',
  PORTRAIT_1440X2560: 'portrait-1440x2560',
} as const;
export type RTMPSettingsRequestQualityEnum =
  (typeof RTMPSettingsRequestQualityEnum)[keyof typeof RTMPSettingsRequestQualityEnum];

export const RawRecordingSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type RawRecordingSettingsRequestModeEnum =
  (typeof RawRecordingSettingsRequestModeEnum)[keyof typeof RawRecordingSettingsRequestModeEnum];

export const RawRecordingSettingsResponseModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type RawRecordingSettingsResponseModeEnum =
  (typeof RawRecordingSettingsResponseModeEnum)[keyof typeof RawRecordingSettingsResponseModeEnum];

export const RecordSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type RecordSettingsRequestModeEnum =
  (typeof RecordSettingsRequestModeEnum)[keyof typeof RecordSettingsRequestModeEnum];

export const RecordSettingsRequestQualityEnum = {
  _360P: '360p',
  _480P: '480p',
  _720P: '720p',
  _1080P: '1080p',
  _1440P: '1440p',
  PORTRAIT_360X640: 'portrait-360x640',
  PORTRAIT_480X854: 'portrait-480x854',
  PORTRAIT_720X1280: 'portrait-720x1280',
  PORTRAIT_1080X1920: 'portrait-1080x1920',
  PORTRAIT_1440X2560: 'portrait-1440x2560',
} as const;
export type RecordSettingsRequestQualityEnum =
  (typeof RecordSettingsRequestQualityEnum)[keyof typeof RecordSettingsRequestQualityEnum];

export const StartClosedCaptionsRequestLanguageEnum = {
  AUTO: 'auto',
  EN: 'en',
  FR: 'fr',
  ES: 'es',
  DE: 'de',
  IT: 'it',
  NL: 'nl',
  PT: 'pt',
  PL: 'pl',
  CA: 'ca',
  CS: 'cs',
  DA: 'da',
  EL: 'el',
  FI: 'fi',
  ID: 'id',
  JA: 'ja',
  RU: 'ru',
  SV: 'sv',
  TA: 'ta',
  TH: 'th',
  TR: 'tr',
  HU: 'hu',
  RO: 'ro',
  ZH: 'zh',
  AR: 'ar',
  TL: 'tl',
  HE: 'he',
  HI: 'hi',
  HR: 'hr',
  KO: 'ko',
  MS: 'ms',
  NO: 'no',
  UK: 'uk',
  BG: 'bg',
  ET: 'et',
  SL: 'sl',
  SK: 'sk',
} as const;
export type StartClosedCaptionsRequestLanguageEnum =
  (typeof StartClosedCaptionsRequestLanguageEnum)[keyof typeof StartClosedCaptionsRequestLanguageEnum];

export const StartTranscriptionRequestLanguageEnum = {
  AUTO: 'auto',
  EN: 'en',
  FR: 'fr',
  ES: 'es',
  DE: 'de',
  IT: 'it',
  NL: 'nl',
  PT: 'pt',
  PL: 'pl',
  CA: 'ca',
  CS: 'cs',
  DA: 'da',
  EL: 'el',
  FI: 'fi',
  ID: 'id',
  JA: 'ja',
  RU: 'ru',
  SV: 'sv',
  TA: 'ta',
  TH: 'th',
  TR: 'tr',
  HU: 'hu',
  RO: 'ro',
  ZH: 'zh',
  AR: 'ar',
  TL: 'tl',
  HE: 'he',
  HI: 'hi',
  HR: 'hr',
  KO: 'ko',
  MS: 'ms',
  NO: 'no',
  UK: 'uk',
  BG: 'bg',
  ET: 'et',
  SL: 'sl',
  SK: 'sk',
} as const;
export type StartTranscriptionRequestLanguageEnum =
  (typeof StartTranscriptionRequestLanguageEnum)[keyof typeof StartTranscriptionRequestLanguageEnum];

export const TranscriptionSettingsRequestClosedCaptionModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsRequestClosedCaptionModeEnum =
  (typeof TranscriptionSettingsRequestClosedCaptionModeEnum)[keyof typeof TranscriptionSettingsRequestClosedCaptionModeEnum];

export const TranscriptionSettingsRequestLanguageEnum = {
  AUTO: 'auto',
  EN: 'en',
  FR: 'fr',
  ES: 'es',
  DE: 'de',
  IT: 'it',
  NL: 'nl',
  PT: 'pt',
  PL: 'pl',
  CA: 'ca',
  CS: 'cs',
  DA: 'da',
  EL: 'el',
  FI: 'fi',
  ID: 'id',
  JA: 'ja',
  RU: 'ru',
  SV: 'sv',
  TA: 'ta',
  TH: 'th',
  TR: 'tr',
  HU: 'hu',
  RO: 'ro',
  ZH: 'zh',
  AR: 'ar',
  TL: 'tl',
  HE: 'he',
  HI: 'hi',
  HR: 'hr',
  KO: 'ko',
  MS: 'ms',
  NO: 'no',
  UK: 'uk',
  BG: 'bg',
  ET: 'et',
  SL: 'sl',
  SK: 'sk',
} as const;
export type TranscriptionSettingsRequestLanguageEnum =
  (typeof TranscriptionSettingsRequestLanguageEnum)[keyof typeof TranscriptionSettingsRequestLanguageEnum];

export const TranscriptionSettingsRequestModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsRequestModeEnum =
  (typeof TranscriptionSettingsRequestModeEnum)[keyof typeof TranscriptionSettingsRequestModeEnum];

export const TranscriptionSettingsResponseClosedCaptionModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsResponseClosedCaptionModeEnum =
  (typeof TranscriptionSettingsResponseClosedCaptionModeEnum)[keyof typeof TranscriptionSettingsResponseClosedCaptionModeEnum];

export const TranscriptionSettingsResponseLanguageEnum = {
  AUTO: 'auto',
  EN: 'en',
  FR: 'fr',
  ES: 'es',
  DE: 'de',
  IT: 'it',
  NL: 'nl',
  PT: 'pt',
  PL: 'pl',
  CA: 'ca',
  CS: 'cs',
  DA: 'da',
  EL: 'el',
  FI: 'fi',
  ID: 'id',
  JA: 'ja',
  RU: 'ru',
  SV: 'sv',
  TA: 'ta',
  TH: 'th',
  TR: 'tr',
  HU: 'hu',
  RO: 'ro',
  ZH: 'zh',
  AR: 'ar',
  TL: 'tl',
  HE: 'he',
  HI: 'hi',
  HR: 'hr',
  KO: 'ko',
  MS: 'ms',
  NO: 'no',
  UK: 'uk',
  BG: 'bg',
  ET: 'et',
  SL: 'sl',
  SK: 'sk',
} as const;
export type TranscriptionSettingsResponseLanguageEnum =
  (typeof TranscriptionSettingsResponseLanguageEnum)[keyof typeof TranscriptionSettingsResponseLanguageEnum];

export const TranscriptionSettingsResponseModeEnum = {
  AVAILABLE: 'available',
  DISABLED: 'disabled',
  AUTO_ON: 'auto-on',
} as const;
export type TranscriptionSettingsResponseModeEnum =
  (typeof TranscriptionSettingsResponseModeEnum)[keyof typeof TranscriptionSettingsResponseModeEnum];

export const VideoSettingsRequestCameraFacingEnum = {
  FRONT: 'front',
  BACK: 'back',
  EXTERNAL: 'external',
} as const;
export type VideoSettingsRequestCameraFacingEnum =
  (typeof VideoSettingsRequestCameraFacingEnum)[keyof typeof VideoSettingsRequestCameraFacingEnum];

export const VideoSettingsResponseCameraFacingEnum = {
  FRONT: 'front',
  BACK: 'back',
  EXTERNAL: 'external',
} as const;
export type VideoSettingsResponseCameraFacingEnum =
  (typeof VideoSettingsResponseCameraFacingEnum)[keyof typeof VideoSettingsResponseCameraFacingEnum];
