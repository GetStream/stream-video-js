import '../rtc/__tests__/mocks/webrtc.mocks';

import { afterEach, describe, expect, it, vi } from 'vitest';
import { fromPartial } from '@total-typescript/shoehorn';
import { Call } from '../Call';
import { StreamClient } from '../coordinator/connection/client';
import { ClientEventReporter } from '../reporting';
import { generateUUIDv4 } from '../coordinator/connection/utils';
import { CallingState, StreamVideoWriteableStateStore } from '../store';
import { CallSessionResponse } from '../gen/coordinator';

const ME = 'jane';

// `resolveOwnRingOutcome` owns the decision and is tested on its own. This
// covers the effect around it: that it runs for a ringing call and that the
// `ringing` guard keeps it off every other call.
describe('Leaving a call settled by the current user', () => {
  let call: Call;

  const createCall = async (ringing: boolean) => {
    const clientStore = new StreamVideoWriteableStateStore();
    const streamClient = new StreamClient('abc');
    call = new Call({
      type: 'test',
      id: generateUUIDv4(),
      streamClient,
      clientEventReporter: new ClientEventReporter({ streamClient }),
      clientStore,
      ringing,
    });

    clientStore.connectedUserSubject.next(fromPartial({ id: ME }));
    vi.spyOn(call, 'leave').mockResolvedValue(undefined);
    await call.setup();
    return call;
  };

  const settleByMe = () =>
    call.state['sessionSubject'].next(
      fromPartial<CallSessionResponse>({
        id: 'session-1',
        accepted_by: {},
        rejected_by: { [ME]: new Date().toISOString() },
        missed_by: {},
        participants: [],
        participants_count_by_role: {},
      }),
    );

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('leaves a ringing call the current user rejected', async () => {
    await createCall(true);
    expect(call.state.callingState).toBe(CallingState.RINGING);

    settleByMe();

    expect(call.leave).toHaveBeenCalled();
  });

  it('ignores the same session on a call that is not ringing', async () => {
    await createCall(false);
    expect(call.state.callingState).toBe(CallingState.IDLE);

    settleByMe();

    expect(call.leave).not.toHaveBeenCalled();
  });
});
