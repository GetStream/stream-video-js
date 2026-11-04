import { AppState } from 'react-native';
import NativeStreamVideoAppLifecycle from '../src/native/NativeStreamVideoAppLifecycle';
import { isInPiPMode$ } from '../src/utils/internal/rxSubjects';
import { appVisibility } from '../src/utils/internal/appVisibility';

jest.mock('@stream-io/video-client', () => ({
  RxUtils: {
    getCurrentValue: (subject: { getValue: () => unknown }) =>
      subject.getValue(),
  },
  videoLoggerSystem: { getLogger: () => ({ warn: jest.fn() }) },
}));

// the native module is mocked in jest-setup.ts
const mockLifecycle = jest.mocked(NativeStreamVideoAppLifecycle!);

describe('appVisibility', () => {
  const originalAppState = AppState.currentState;

  beforeEach(() => {
    jest.clearAllMocks();
    mockLifecycle.getCurrentAppState.mockReset().mockReturnValue('active');
    isInPiPMode$.next(false);
  });

  afterEach(() => {
    AppState.currentState = originalAppState;
  });

  it('is hidden in the background, unless in picture-in-picture', () => {
    mockLifecycle.getCurrentAppState.mockReturnValue('background');
    expect(appVisibility.getVisibility()).toEqual({ hidden: true });

    isInPiPMode$.next(true);
    expect(appVisibility.getVisibility()).toEqual({ hidden: false });
  });

  it('is visible while active or inactive', () => {
    mockLifecycle.getCurrentAppState.mockReturnValue('active');
    expect(appVisibility.getVisibility()).toEqual({ hidden: false });

    mockLifecycle.getCurrentAppState.mockReturnValue('inactive');
    expect(appVisibility.getVisibility()).toEqual({ hidden: false });
  });

  it('falls back to AppState when the native module throws', () => {
    mockLifecycle.getCurrentAppState.mockImplementation(() => {
      throw new Error('bridge error');
    });
    AppState.currentState = 'background';
    expect(appVisibility.getVisibility()).toEqual({ hidden: true });
  });

  it('reports app state and picture-in-picture changes until stopped', () => {
    const onChange = jest.fn();
    const stop = appVisibility.watch(onChange);
    onChange.mockClear();

    const { calls, results } = (
      mockLifecycle.onAppStateChanged as unknown as jest.Mock
    ).mock;
    const emitAppState = calls[calls.length - 1][0] as (state: string) => void;
    const remove = results[results.length - 1]!.value.remove as jest.Mock;

    emitAppState('background');
    isInPiPMode$.next(true);
    expect(onChange).toHaveBeenCalledTimes(2);

    stop();
    expect(remove).toHaveBeenCalledTimes(1);
    isInPiPMode$.next(false);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('uses AppState where the native module is unavailable', () => {
    // the mocked module is a plain object, read by appVisibility on each call
    const nativeModule = jest.requireMock<{ default: unknown }>(
      '../src/native/NativeStreamVideoAppLifecycle',
    );
    const native = nativeModule.default;
    nativeModule.default = null;
    const remove = jest.fn();
    const addEventListener = jest
      .spyOn(AppState, 'addEventListener')
      .mockReturnValue({ remove } as unknown as ReturnType<
        typeof AppState.addEventListener
      >);
    try {
      AppState.currentState = 'background';
      expect(appVisibility.getVisibility()).toEqual({ hidden: true });

      const onChange = jest.fn();
      const stop = appVisibility.watch(onChange);
      expect(addEventListener).toHaveBeenCalledWith('change', onChange);
      stop();
      expect(remove).toHaveBeenCalledTimes(1);
    } finally {
      nativeModule.default = native;
      addEventListener.mockRestore();
    }
  });
});
