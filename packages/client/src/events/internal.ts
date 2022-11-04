import { Dispatcher } from '../rtc/Dispatcher';
import { Call } from '../rtc/Call';

/**
 * An event responder which handles the `changePublishQuality` event.
 */
export const watchChangePublishQuality = (
  dispatcher: Dispatcher,
  call: Call,
) => {
  return dispatcher.on('changePublishQuality', (e) => {
    if (e.eventPayload.oneofKind !== 'changePublishQuality') return;
    const { videoSenders } = e.eventPayload.changePublishQuality;
    videoSenders.forEach((videoSender) => {
      const { layers } = videoSender;
      call.updatePublishQuality(
        layers.filter((l) => l.active).map((l) => l.name),
      );
    });
  });
};
