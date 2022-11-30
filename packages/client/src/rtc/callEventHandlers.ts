import { Call } from './Call';
import { Dispatcher } from './Dispatcher';
import { StreamVideoWriteableStateStore2 } from '../store';
import {
  watchParticipantJoined,
  watchParticipantLeft,
} from '../events/participant';
import { watchChangePublishQuality } from '../events/internal';
import {
  watchAudioLevelChanged,
  watchDominantSpeakerChanged,
} from '../events/speaker';
import { watchMuteStateChanged } from '../events/mute';

export const registerEventHandlers = (
  call: Call,
  store: StreamVideoWriteableStateStore2,
  dispatcher: Dispatcher,
) => {
  watchChangePublishQuality(dispatcher, call);

  watchParticipantJoined(dispatcher, store);
  watchParticipantLeft(dispatcher, store);

  watchAudioLevelChanged(dispatcher, store);
  watchDominantSpeakerChanged(dispatcher, store);
  watchMuteStateChanged(dispatcher, store);
};
