import {
  type CallMediaEngine,
  type MediaEngineOptions,
  SfuModels,
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
 * `PeerConnectionFactory` (with the call's audio profile) and sets it as the
 * single live factory. The WebRTC globals (`getUserMedia`/`getDisplayMedia`/
 * `new RTCPeerConnection`) then resolve to it, so the call's tracks and peer
 * connections are created with — and torn down with — that one native factory,
 * which is what lets the call own its AudioDeviceModule. The engine itself only
 * manages the factory lifecycle (`dispose` at leave).
 *
 * @internal
 */
export function registerCallMediaEngine() {
  setCallMediaEngineProvider(
    async (options: MediaEngineOptions): Promise<CallMediaEngine> => {
      // Voice processing must be bypassed for two independent cases:
      //  1. The music / high-quality mic profile (raw, unprocessed capture).
      //     Requested via `call.microphone.setAudioBitrateProfile(SfuModels.AudioBitrateProfile.MUSIC_HIGH_QUALITY)`.
      //     When no profile is requested, the factory is built with the standard voice profile.
      //  2. Stereo audio output — WebRTC's APM (AEC/NS) downmixes to mono, so
      //     stereo playout only flows when voice processing is off. On Android
      //     this is a factory-build-time decision, so the stereo-output preference
      //     recorded via `callManager.start` must be resolved here, before the factory is built.
      const config = callManager.getStoredConfig();
      const stereoOutputRequested =
        config?.audioRole === 'listener' &&
        config.enableStereoAudioOutput === true;
      const bypassVoiceProcessing =
        options.audioBitrateProfile ===
          SfuModels.AudioBitrateProfile.MUSIC_HIGH_QUALITY ||
        stereoOutputRequested;
      const factory = await CallFactory.create({
        bypassVoiceProcessing,
        //stereoInputEnabled: false, TODO: decide how this param is defined from client side
      });
      logger.debug(
        `Created per-call factory (bypassVoiceProcessing=${bypassVoiceProcessing}, stereoOutput=${stereoOutputRequested})`,
      );

      return {
        dispose: async () => {
          logger.debug('Disposing per-call factory');
          return await factory.dispose();
        },
      };
    },
  );
}
