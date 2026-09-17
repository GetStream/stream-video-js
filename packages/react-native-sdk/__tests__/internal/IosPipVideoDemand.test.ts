import { firstValueFrom } from 'rxjs';
import { getIosPipVideoDemand } from '../../src/utils/internal/IosPipVideoDemand';
import { mockCall } from '../mocks/call';
import { mockClientWithUser } from '../mocks/client';

const trackKey = {
  sessionId: 'remote-session-1',
  trackType: 'videoTrack' as const,
};

const demandOfNewCall = () =>
  getIosPipVideoDemand(mockCall(mockClientWithUser({ id: 'test-user-id' })));

describe('IosPipVideoDemand', () => {
  it('reuses one instance per call and isolates calls of the same cid', () => {
    const client = mockClientWithUser({ id: 'test-user-id' });
    const call = mockCall(client);
    const otherCall = mockCall(client);

    expect(getIosPipVideoDemand(call)).toBe(getIosPipVideoDemand(call));
    expect(getIosPipVideoDemand(call)).not.toBe(
      getIosPipVideoDemand(otherCall),
    );
  });

  it('drops the bounds and the ownership of a released window', async () => {
    const demand = demandOfNewCall();
    const window = demand.claimWindow();
    window.setBounds({ width: 180, height: 240 });
    window.own(trackKey);

    window.release();
    // a second release of the same window changes nothing
    window.release();

    expect(window.dimensions$.getValue()).toBeUndefined();
    await expect(firstValueFrom(demand.isOwnedByPip$(trackKey))).resolves.toBe(
      false,
    );

    // a disposed window neither reports geometry nor owns tracks anymore
    window.setBounds({ width: 200, height: 300 });
    window.own(trackKey);
    expect(window.dimensions$.getValue()).toBeUndefined();
    await expect(firstValueFrom(demand.isOwnedByPip$(trackKey))).resolves.toBe(
      false,
    );
  });
});
