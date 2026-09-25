import React, { type PropsWithChildren } from 'react';
import { act, renderHook } from '@testing-library/react-native';
import { BehaviorSubject } from 'rxjs';
import {
  BackgroundFiltersProvider,
  useBackgroundFilters,
} from '../../src/contexts/BackgroundFilters';

// the SDK requires the filters module at import time, so the mock must be
// self-contained in the factory
jest.mock('@stream-io/video-filters-react-native', () => ({
  registerBackgroundBlurVideoFilters: jest.fn(() => true),
  registerBlurVideoFilters: jest.fn(() => true),
  registerVirtualBackgroundFilter: jest.fn(() => 'uri'),
  unregisterAllFilters: jest.fn(() => true),
}));

const mockFiltersModule = jest.requireMock<
  jest.Mocked<typeof import('@stream-io/video-filters-react-native')>
>('@stream-io/video-filters-react-native');

const mockTrack = { _setVideoEffect: jest.fn() };
const mockMediaStream = { getVideoTracks: () => [mockTrack] };
const mockCall = {
  camera: {
    state: {
      mediaStream: mockMediaStream,
      mediaStream$: new BehaviorSubject<unknown>(mockMediaStream),
    },
  },
  tracer: { trace: jest.fn() },
};

jest.mock('@stream-io/video-react-bindings', () => ({
  useCall: () => mockCall,
}));

const wrapper = ({ children }: PropsWithChildren) => (
  <BackgroundFiltersProvider>{children}</BackgroundFiltersProvider>
);

describe('BackgroundFiltersProvider synchronous API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registers the background blur filters once and applies the effect', () => {
    const { result } = renderHook(() => useBackgroundFilters(), { wrapper });

    let returned: unknown;
    act(() => {
      returned = result.current.applyBackgroundBlurFilter('heavy');
    });
    act(() => {
      result.current.applyBackgroundBlurFilter('heavy');
    });

    expect(returned).toBeUndefined();
    expect(
      mockFiltersModule.registerBackgroundBlurVideoFilters,
    ).toHaveBeenCalledTimes(1);
    expect(mockTrack._setVideoEffect).toHaveBeenCalledWith(
      'BackgroundBlurHeavy',
    );
  });

  it('throws synchronously when the native registration fails', () => {
    const error = new Error('registration failed');
    mockFiltersModule.registerBlurVideoFilters.mockImplementationOnce(() => {
      throw error;
    });
    const { result } = renderHook(() => useBackgroundFilters(), { wrapper });

    expect(() => result.current.applyVideoBlurFilter('heavy')).toThrow(error);
    expect(mockTrack._setVideoEffect).not.toHaveBeenCalled();
  });

  it('unregisters all filters on unmount and swallows errors', () => {
    mockFiltersModule.unregisterAllFilters.mockImplementationOnce(() => {
      throw new Error('unregister failed');
    });
    const { unmount } = renderHook(() => useBackgroundFilters(), { wrapper });

    expect(() => unmount()).not.toThrow();
    expect(mockFiltersModule.unregisterAllFilters).toHaveBeenCalledTimes(1);
  });
});
