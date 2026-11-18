import React from 'react';
import { CallingState, SfuModels } from '@stream-io/video-client';
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

const setupCall = () => {
  const call = mockCall(mockClientWithUser());
  call.get = jest.fn().mockResolvedValue({});
  call.join = jest.fn().mockResolvedValue(undefined);
  call.state.setBackstage(true);
  return call;
};

const stopLive = (call: ReturnType<typeof setupCall>) => {
  call['dispatcher'].dispatch({
    eventPayload: {
      oneofKind: 'callEnded',
      callEnded: { reason: SfuModels.CallEndedReason.LIVE_ENDED },
    },
  });
};

describe('ViewerLivestream', () => {
  it('watches the call again and rejoins once live after Stop Live', async () => {
    const call = setupCall();
    render(<ViewerLivestream />, { call });
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(1));

    act(() => {
      stopLive(call);
      call.state.setCallingState(CallingState.LEFT);
    });
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(2));

    act(() => call.state.setCallingState(CallingState.IDLE));
    expect(call.join).not.toHaveBeenCalled();

    act(() => call.state.setBackstage(false));
    await waitFor(() => expect(call.join).toHaveBeenCalledTimes(1));
  });

  it('does not rejoin a viewer who left on their own', async () => {
    const call = setupCall();
    render(<ViewerLivestream />, { call });
    await waitFor(() => expect(call.get).toHaveBeenCalledTimes(1));

    act(() => call.state.setCallingState(CallingState.LEFT));
    act(() => call.state.setCallingState(CallingState.IDLE));
    act(() => call.state.setBackstage(false));

    await screen.findByText('Livestream is still in progress');
    expect(call.get).toHaveBeenCalledTimes(1);
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
