import 'webrtc-adapter';

export * from './src/gen/coordinator';
export type {} from './src/gen/coordinator/models/timestamp-guard';
// Types for the `common`-tagged routes the video-only spec omits (devices,
// guest, WS auth) and for the v1 routes Call still uses. See src/gen/shims.ts.
export type {
  ConnectUserDetailsRequest,
  CreateDeviceRequest,
  CreateGuestRequest,
  CreateGuestResponse,
  ListDevicesResponse,
  Response,
  UserRequest,
  WSAuthMessage,
} from './src/gen/shims';
export * from './src/coordinator/connection/types';
export type {
  RateLimit,
  RequestMetadata,
  StreamResponse,
} from './src/coordinator/connection/api-client';

export * as SfuEvents from './src/gen/video/sfu/event/events';
export * as SfuModels from './src/gen/video/sfu/models/models';

export * from './src/types';
export * from './src/stats/types';

export * from './src/Call';
export * from './src/CallType';
export * from './src/rtc/mediaEngine';
export * from './src/StreamVideoClient';
export * from './src/StreamSfuClient';
export * from './src/devices';
export * from './src/errors';
export * from './src/store';
export * from './src/sorting';
export * from './src/helpers/client-details';
export * from './src/helpers/humanize';
export * from './src/helpers/DynascaleManager';
export * from './src/helpers/ViewportTracker';
export * from './src/helpers/sound-detector';
export * from './src/helpers/loopback';
export * from './src/helpers/MediaStreamRecorder';
export * from './src/helpers/participantUtils';
export * from './src/rtc/e2ee/E2EEManager';
export * from './src/rtc/e2ee/EncryptionManager';
export * as Browsers from './src/helpers/browsers';

export * from './src/logger';
export * from './src/helpers/time';
