import 'webrtc-adapter';

import * as SfuEvents from './src/gen/video/sfu/event/events';
import * as SfuModels from './src/gen/video/sfu/models/models';
import * as CallMeta from './src/gen/video/coordinator/call_v1/call';

export { SfuModels, SfuEvents };
export { CallMeta }; // due to name collision with `/rtc/Call.ts`

export * from './src/gen/google/protobuf/struct';
export * from './src/gen/video/coordinator/client_v1_rpc/client_rpc';
export * from './src/gen/video/coordinator/edge_v1/edge';
export * from './src/gen/video/coordinator/event_v1/event';
export * from './src/gen/video/coordinator/user_v1/user';

export * from './src/rpc/types';
export * from './src/ws/types';
export * from './src/StreamVideoClient';
export * from './src/StreamSfuClient';

export * from './src/rtc/Call';
export * from './src/stateStore';
