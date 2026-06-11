import { useCall } from '@stream-io/video-react-bindings';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { callManager } from '../../modules/call-manager';
import type { IOSAudioInterruptionEvent } from '../../modules/call-manager';
import { getCallingxLibIfAvailable } from '../../utils/push/libs/callingx';
import { videoLoggerSystem } from '@stream-io/video-client';

type CallingxAudioInterruptionEvents = {
  addEventListener: (
    eventName: 'didAudioInterruption',
    listener: (event: IOSAudioInterruptionEvent) => void,
  ) => { remove: () => void };
};

/**
 * Traces iOS audio interruptions while a StreamCall provider is mounted.
 */
export const AudioInterruptionTracer = () => {
  const call = useCall();

  useEffect(() => {
    if (Platform.OS !== 'ios' || !call) {
      return;
    }

    const traceAudioInterruption = (event: IOSAudioInterruptionEvent) => {
      call.tracer.trace(`ios.audioInterruption.${event.phase}`, event);
      videoLoggerSystem
        .getLogger('Call')
        .info(`ios.audioInterruption.${event.phase}`, event);
    };

    const removeInCallManagerListener =
      callManager.ios.addAudioInterruptionListener(traceAudioInterruption);
    const callingx = getCallingxLibIfAvailable() as
      | CallingxAudioInterruptionEvents
      | undefined;
    const callingxSubscription = callingx?.addEventListener(
      'didAudioInterruption',
      traceAudioInterruption,
    );

    return () => {
      removeInCallManagerListener();
      callingxSubscription?.remove();
    };
  }, [call]);

  return null;
};
