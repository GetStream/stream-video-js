import { renderHook } from '@testing-library/react-native';
import {
  FloatingViewAlignment,
  getClosestSnapAlignment,
  getSnapAlignments,
} from '../../src/components/Participant/FloatingParticipantView/FloatingView/common';
import { useFloatingVideoDimensions } from '../../src/components/Participant/FloatingParticipantView/useFloatingVideoDimensions';
import { useTrackDimensions } from '../../src/hooks/useTrackDimensions';
import mockParticipant from '../mocks/participant';

jest.mock('../../src/hooks/useTrackDimensions', () => ({
  useTrackDimensions: jest.fn(),
}));

const mockedUseTrackDimensions = useTrackDimensions as jest.MockedFunction<
  typeof useTrackDimensions
>;

describe('getClosestSnapAlignment', () => {
  const snapAlignments = getSnapAlignments({
    rootContainerDimensions: { width: 400, height: 800 },
    floatingViewDimensions: { width: 100, height: 200 },
  });

  it.each([
    [{ x: 10, y: 10 }, FloatingViewAlignment.topLeft],
    [{ x: 290, y: 10 }, FloatingViewAlignment.topRight],
    [{ x: 10, y: 590 }, FloatingViewAlignment.bottomLeft],
    [{ x: 290, y: 590 }, FloatingViewAlignment.bottomRight],
  ])('returns the alignment closest to %o', (position, expected) => {
    expect(getClosestSnapAlignment({ position, snapAlignments })).toBe(
      expected,
    );
  });

  it('returns an alignment that stays valid after the container resizes', () => {
    const alignment = getClosestSnapAlignment({
      position: { x: 10, y: 590 },
      snapAlignments,
    });
    const resized = getSnapAlignments({
      rootContainerDimensions: { width: 900, height: 600 },
      floatingViewDimensions: { width: 100, height: 200 },
    });
    expect(resized[alignment]).toEqual({ x: 0, y: 400 });
  });
});

describe('useFloatingVideoDimensions', () => {
  const participant = mockParticipant();

  beforeEach(() => {
    mockedUseTrackDimensions.mockReturnValue({ width: 640, height: 480 });
  });

  it('is undefined until the container has been measured', () => {
    const { result } = renderHook(() =>
      useFloatingVideoDimensions(undefined, participant, 'videoTrack'),
    );
    expect(result.current).toBeUndefined();
  });

  it('sizes the view from its container, not the window', () => {
    const { result, rerender } = renderHook(
      ({ container }) =>
        useFloatingVideoDimensions(container, participant, 'videoTrack'),
      { initialProps: { container: { width: 400, height: 800 } } },
    );
    expect(result.current?.height).toBeCloseTo(400 * 0.23);
    expect(result.current?.width).toBeCloseTo(400 * 0.23 * (640 / 480));

    rerender({ container: { width: 900, height: 600 } });
    expect(result.current?.height).toBeCloseTo(600 * 0.23);
  });
});
