import { StreamRNVideoSDKGlobals } from '@stream-io/video-client';
import { callManager } from '../../modules/call-manager';

declare global {
  var streamRNVideoSDK: StreamRNVideoSDKGlobals | undefined;
}

const streamRNVideoSDKGlobals: StreamRNVideoSDKGlobals = {
  callManager: {
    setup: () => {
      callManager.setup();
    },
    start: () => {
      callManager.start();
    },
    stop: () => {
      callManager.stop();
    },
  },
};

export function registerSDKGlobals() {
  if (!global.streamRNVideoSDK) {
    global.streamRNVideoSDK = streamRNVideoSDKGlobals;
  }
}
