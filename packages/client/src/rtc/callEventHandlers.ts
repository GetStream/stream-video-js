import { Call } from './Call';
import { Dispatcher } from './Dispatcher';
import { StreamVideoWriteableStateStore } from '../stateStore';
import {
  watchParticipantJoined,
  watchParticipantLeft,
} from '../events/participant';
import { watchChangePublishQuality } from '../events/internal';

export const registerEventHandlers = (
  call: Call,
  store: StreamVideoWriteableStateStore,
  dispatcher: Dispatcher,
) => {
  watchChangePublishQuality(dispatcher, call);

  watchParticipantJoined(dispatcher, store);
  watchParticipantLeft(dispatcher, store);
};
