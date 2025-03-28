import 'webrtc-adapter';

// side effect: we patch the mediaDevices APIs here
// so we can intercept invocations and collect statistics
import './src/stats/rtc/mediaDevices';

export * from './src/gen/coordinator';
export * from './src/coordinator/connection/types';

export * as SfuEvents from './src/gen/video/sfu/event/events';
export * as SfuModels from './src/gen/video/sfu/models/models';

export * from './src/types';
export * from './src/stats/types';

export * from './src/Call';
export * from './src/CallType';
export * from './src/StreamVideoClient';
export * from './src/StreamSfuClient';
export * from './src/devices';
export * from './src/store';
export * from './src/sorting';
export * from './src/helpers/client-details';
export * from './src/helpers/DynascaleManager';
export * from './src/helpers/ViewportTracker';
export * from './src/helpers/sound-detector';
export * from './src/helpers/participantUtils';
export * as Browsers from './src/helpers/browsers';

export * from './src/logger';
