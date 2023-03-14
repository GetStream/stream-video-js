import { Call } from './Call';
import { Dispatcher } from './Dispatcher';
import { CallState } from '../store';
import {
  watchChangePublishQuality,
  watchConnectionQualityChanged,
} from '../events/internal';
import {
  watchParticipantJoined,
  watchParticipantLeft,
  watchTrackPublished,
  watchTrackUnpublished,
} from '../events/participant';
import {
  watchAudioLevelChanged,
  watchDominantSpeakerChanged,
} from '../events/speaker';

export const registerEventHandlers = (
  call: Call,
  store: CallState,
  dispatcher: Dispatcher,
) => {
  watchChangePublishQuality(dispatcher, call);
  watchConnectionQualityChanged(dispatcher, store);

  watchParticipantJoined(dispatcher, store);
  watchParticipantLeft(dispatcher, store);

  watchTrackPublished(dispatcher, store);
  watchTrackUnpublished(dispatcher, store);

  watchAudioLevelChanged(dispatcher, store);
  watchDominantSpeakerChanged(dispatcher, store);
};
