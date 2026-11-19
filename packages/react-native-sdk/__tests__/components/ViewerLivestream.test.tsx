import React from 'react';
import {
  CallingState,
  OwnCapability,
  SfuModels,
  type StreamVideoEvent,
} from '@stream-io/video-client';
import { mockClientWithUser } from '../mocks/client';
import { mockCall } from '../mocks/call';
import { act, fireEvent, render, screen, waitFor } from '../utils/RNTLTools';
import { ViewerLivestream } from '../../src/components/Livestream/ViewerLivestream';

console.warn = jest.fn();

// the global Platform mock in jest-setup.ts lacks `select` for RN's Button
jest.mock('react-native/Libraries/Components/Button', () => {
  const { Pressable, Text } = jest.requireActual('react-native');
  const Button = (props: { title: string; onPress: () => void }) => (
    <Pressable onPress={props.onPress}>
      <Text>{props.title}</Text>
    </Pressable>
  );
  return { __esModule: true, default: Button };
});

const setupCall = (ownCapabilities: OwnCapability[] = []) => {
  const call = mockCall(mockClientWithUser(), undefined, ownCapabilities);
  call.get = jest.fn().mockResolvedValue({});
  call.join = jest.fn().mockResolvedValue(undefined);
  call.listRecordings = jest.fn().mockResolvedValue({ recordings: [] });
  call.state.setBackstage(true);
  return call;
};

type TestCall = ReturnType<typeof setupCall>;

/** Makes the viewer eligible to join early, before the call is live. */
const allowEarlyJoin = (call: TestCall) => {
  call.state['startsAtSubject'].next(new Date(Date.now() - 60_000));
};

const stopLive = (call: TestCall) => {
  call['dispatcher'].dispatch({
    eventPayload: {
      oneofKind: 'callEnded',
      callEnded: { reason: SfuModels.CallEndedReason.LIVE_ENDED },
    },
  });
};

const endCall = (call: TestCall) => {
  call['streamClient'].dispatchEvent({
    type: 'call.ended',
    call_cid: call.cid,
  } as StreamVideoEvent);
  call.state.setEndedAt(new Date());
};

/** Stop Live takes a joined viewer out; the lobby loads the call again. */
const leaveOnStopLive = async (call: TestCall) => {
  act(() => {
    stopLive(call);
    call.state.setCallingState(CallingState.LEFT);
  });
  await waitFor(() => expect(call.get).toHaveBeenCalledTimes(2));
  act(() => call.state.setCallingState(CallingState.IDLE));
};

describe('ViewerLivestream', () => {
  it('waits for Go Live before rejoining after Stop Live', async () => {
    const call = setupCall();
    allowEarlyJoin(call);
    call.state.setCallingState(CallingState.JOINED);
    render(<ViewerLivestream />, { call });
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(1));

    await leaveOnStopLive(call);
    expect(call.join).not.toHaveBeenCalled();

    act(() => call.state.setBackstage(false));
    await waitFor(() => expect(call.join).toHaveBeenCalledTimes(1));
  });

  it('does not rejoin a viewer who left on their own', async () => {
    const call = setupCall();
    render(<ViewerLivestream />, { call });
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(1));

    act(() => call.state.setCallingState(CallingState.LEFT));
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(2));
    act(() => call.state.setCallingState(CallingState.IDLE));
    act(() => call.state.setBackstage(false));

    await screen.findByText('Livestream is still in progress');
    expect(call.join).not.toHaveBeenCalled();
  });

  it('does not rejoin a backstage viewer who stayed through Stop Live and then left', async () => {
    const call = setupCall([OwnCapability.JOIN_BACKSTAGE]);
    call.state.setCallingState(CallingState.JOINED);
    render(<ViewerLivestream />, { call });
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(1));

    act(() => stopLive(call));
    act(() => call.state.setCallingState(CallingState.LEFT));
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(2));
    act(() => call.state.setCallingState(CallingState.IDLE));
    act(() => call.state.setBackstage(false));

    await screen.findByText('Livestream is still in progress');
    expect(call.join).not.toHaveBeenCalled();
  });

  it('does not join after the call ends', async () => {
    const call = setupCall();
    allowEarlyJoin(call);
    call.state.setCallingState(CallingState.JOINED);
    render(<ViewerLivestream />, { call });
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(1));

    await leaveOnStopLive(call);
    act(() => endCall(call));

    await screen.findByText('The livestream has ended.');
    expect(call.join).not.toHaveBeenCalled();
  });

  it('shows an error view with a working retry when loading fails', async () => {
    const call = setupCall();
    call.get = jest
      .fn()
      .mockRejectedValueOnce(new Error('not found'))
      .mockResolvedValue({});
    render(<ViewerLivestream />, { call });

    fireEvent.press(await screen.findByText('Try again'));

    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(2));
    expect(screen.queryByText('The livestream could not be loaded')).toBeNull();
  });
});
