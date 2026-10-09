import React from 'react';
import { Pressable, Text } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import {
  NoiseCancellationProvider,
  useNoiseCancellation,
} from '../../src/providers/NoiseCancellation/NoiseCancellationProvider';

const mockNativeModule = {
  isEnabled: jest.fn(() => false),
  deviceSupportsAdvancedAudioProcessing: jest.fn(() => true),
};
const mockNoiseCancellation = {
  enable: jest.fn().mockResolvedValue(undefined),
  disable: jest.fn().mockResolvedValue(undefined),
};

jest.mock('../../src/providers/NoiseCancellation/lib', () => ({
  getNoiseCancellationLibThrowIfNotInstalled: () => mockNativeModule,
  NoiseCancellationWrapper: { getInstance: () => mockNoiseCancellation },
}));

jest.mock('@stream-io/video-react-bindings', () => ({
  useCall: () => undefined,
  useCallStateHooks: () => ({
    useCallSettings: () => undefined,
    useHasPermissions: () => false,
  }),
}));

const Controls = () => {
  const { isEnabled, deviceSupportsAdvancedAudioProcessing, setEnabled } =
    useNoiseCancellation();
  return (
    <>
      <Text>{`enabled=${isEnabled}, supported=${deviceSupportsAdvancedAudioProcessing}`}</Text>
      <Pressable onPress={() => setEnabled(true)}>
        <Text>Enable</Text>
      </Pressable>
      <Pressable onPress={() => setEnabled(false)}>
        <Text>Disable</Text>
      </Pressable>
    </>
  );
};

describe('NoiseCancellationProvider synchronous native API', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockNoiseCancellation.enable.mockReset().mockResolvedValue(undefined);
    mockNoiseCancellation.disable.mockReset().mockResolvedValue(undefined);
  });

  it('reads synchronous booleans and invokes the asynchronous class adapter', () => {
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <NoiseCancellationProvider>
        <Controls />
      </NoiseCancellationProvider>,
    );

    expect(screen.getByText('enabled=false, supported=true')).toBeVisible();
    fireEvent.press(screen.getByText('Enable'));
    fireEvent.press(screen.getByText('Disable'));
    expect(mockNoiseCancellation.enable).toHaveBeenCalledTimes(1);
    expect(mockNoiseCancellation.disable).toHaveBeenCalledTimes(1);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it.each(['enable', 'disable'] as const)(
    'handles an adapter %s rejection',
    async (operation) => {
      const error = new Error('Processor not registered');
      mockNoiseCancellation[operation].mockRejectedValue(error);
      const errorLog = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      render(
        <NoiseCancellationProvider>
          <Controls />
        </NoiseCancellationProvider>,
      );

      fireEvent.press(
        screen.getByText(operation === 'enable' ? 'Enable' : 'Disable'),
      );
      await waitFor(() => {
        expect(errorLog).toHaveBeenCalledWith(
          `Failed to ${operation} noise cancellation`,
          error,
        );
      });
    },
  );

  it('handles a synchronous state query failure during mounting', () => {
    const error = new Error('Processor not registered');
    mockNativeModule.isEnabled.mockImplementationOnce(() => {
      throw error;
    });
    const errorLog = jest.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <NoiseCancellationProvider>
        <Controls />
      </NoiseCancellationProvider>,
    );

    expect(screen.getByText('enabled=false, supported=true')).toBeVisible();
    expect(errorLog).toHaveBeenCalledWith(
      'Failed to read noise cancellation state',
      error,
    );
  });
});
