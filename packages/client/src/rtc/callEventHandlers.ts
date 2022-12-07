import { Call } from './Call';
import { Dispatcher } from './Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';
import {
  watchParticipantJoined,
  watchParticipantLeft,
  watchTrackPublished,
  watchTrackUnpublished,
} from '../events/participant';
import { watchChangePublishQuality } from '../events/internal';
import {
  watchAudioLevelChanged,
  watchDominantSpeakerChanged,
} from '../events/speaker';

export const registerEventHandlers = (
  call: Call,
  store: StreamVideoWriteableStateStore,
  dispatcher: Dispatcher,
) => {
  watchChangePublishQuality(dispatcher, call);

  watchParticipantJoined(dispatcher, store);
  watchParticipantLeft(dispatcher, store);

  watchTrackPublished(dispatcher, store);
  watchTrackUnpublished(dispatcher, store);

  watchAudioLevelChanged(dispatcher, store);
  watchDominantSpeakerChanged(dispatcher, store);
};
