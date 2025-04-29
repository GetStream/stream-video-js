import { describe, expect, it } from 'vitest';
import { CallState } from '../../store';
import { noopComparator } from '../../sorting';
import {
  watchAudioLevelChanged,
  watchDominantSpeakerChanged,
} from '../speaker';
import { Dispatcher } from '../../rtc';

describe('speaker events', () => {
  it('should watch dominant speaker changed', () => {
    const state = new CallState();
    state.setSortParticipantsBy(noopComparator());
    state.setParticipants([
      // @ts-expect-error incomplete data
      { userId: 'user-1', sessionId: 'session-1', isDominantSpeaker: false },
      // @ts-expect-error incomplete data
      { userId: 'user-2', sessionId: 'session-2', isDominantSpeaker: true },
    ]);
    const dispatcher = new Dispatcher();

    watchDominantSpeakerChanged(dispatcher, state);

    dispatcher.dispatch({
      eventPayload: {
        oneofKind: 'dominantSpeakerChanged',
        // @ts-expect-error incomplete data
        dominantSpeakerChanged: {
          userId: 'user-1',
          sessionId: 'session-1',
        },
      },
    });

    expect(state.participants).toEqual([
      { userId: 'user-1', sessionId: 'session-1', isDominantSpeaker: true },
      { userId: 'user-2', sessionId: 'session-2', isDominantSpeaker: false },
    ]);
  });

  it('watchAudioLevelChanged', () => {
    const state = new CallState();
    state.setSortParticipantsBy(noopComparator());
    state.setParticipants([
      // @ts-expect-error incomplete data
      {
        userId: 'user-1',
        sessionId: 'session-1',
        audioLevel: 0,
        isSpeaking: false,
      },
      // @ts-expect-error incomplete data
      {
        userId: 'user-2',
        sessionId: 'session-2',
        audioLevel: 0,
        isSpeaking: false,
      },
    ]);
    const dispatcher = new Dispatcher();

    watchAudioLevelChanged(dispatcher, state);

    dispatcher.dispatch({
      eventPayload: {
        oneofKind: 'audioLevelChanged',
        // @ts-expect-error incomplete data
        audioLevelChanged: {
          audioLevels: [
            { sessionId: 'session-1', level: 0.5, isSpeaking: true },
            { sessionId: 'session-2', level: 0.5, isSpeaking: true },
          ],
        },
      },
    });

    expect(state.participants).toEqual([
      {
        userId: 'user-1',
        sessionId: 'session-1',
        audioLevel: 0.5,
        isSpeaking: true,
      },
      {
        userId: 'user-2',
        sessionId: 'session-2',
        audioLevel: 0.5,
        isSpeaking: true,
      },
    ]);
  });
});
