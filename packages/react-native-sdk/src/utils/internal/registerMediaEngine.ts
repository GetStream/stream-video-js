import {
  type CallMediaEngine,
  setCallMediaEngineProvider,
  videoLoggerSystem,
} from '@stream-io/video-client';
import { CallFactory } from '@stream-io/react-native-webrtc';
import { callManager } from '../../modules/call-manager';

const logger = videoLoggerSystem.getLogger('CallMediaEngine');

/**
 * Registers the React Native {@link CallMediaEngine} provider.
 *
 * Once registered, every `Call.ensureMediaFactory()` builds the call's native
 * `PeerConnectionFactory` (with the call's audio configuration) and sets it as
 * the single live factory. The WebRTC globals (`getUserMedia`/`getDisplayMedia`/
 * `new RTCPeerConnection`) then resolve to it, so the call's tracks and peer
 * connections are created with — and torn down with — that one native factory,
 * which is what lets the call own its AudioDeviceModule. The engine itself only
 * manages the factory lifecycle (`dispose` at leave).
 *
 * @internal
 */
export function registerCallMediaEngine() {
  setCallMediaEngineProvider(async (): Promise<CallMediaEngine> => {
    const config = callManager.getStoredConfig();
    const bypassVoiceProcessing = config?.audioRole === 'listener';
    const factory = await CallFactory.create({
      bypassVoiceProcessing,
    });
    logger.debug(
      `Created per-call factory (bypassVoiceProcessing=${bypassVoiceProcessing})`,
    );

    return {
      dispose: async () => {
        logger.debug('Disposing per-call factory');
        return await factory.dispose();
      },
    };
  });
}
