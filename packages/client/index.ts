import 'webrtc-adapter';

export * from './src/gen/coordinator';
// FIXME OL: check whether we need to expose these types
export * from './src/coordinator/connection/types';

export * as SfuEvents from './src/gen/video/sfu/event/events';
export * as SfuModels from './src/gen/video/sfu/models/models';

export * from './src/config/types';
export * from './src/config/defaultConfigs';
export * from './src/rtc/types';
export * from './src/stats/types';

export * from './src/rtc/Call';
export * from './src/StreamVideoClient';
export * from './src/StreamSfuClient';
export * from './src/devices';
export * from './src/store';
export * from './src/ViewportTracker';

export * from './src/config/defaultConfigs';

export * from './src/helpers/sound-detector';
export * as Browsers from './src/helpers/browsers';
