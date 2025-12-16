import { beforeEach, describe, expect, it, vi } from 'vitest';
import { of } from 'rxjs';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { StreamVideoWriteableStateStore } from '../../store';
import { DeviceManagerState } from '../DeviceManagerState';
import { DeviceManager } from '../DeviceManager';
import {
  mockBrowserPermission,
  mockVideoDevices,
  mockVideoStream,
} from './mocks';
import { TrackType } from '../../gen/video/sfu/models/models';

import '../../rtc/__tests__/mocks/webrtc.mocks';

class TestInputMediaDeviceManagerState extends DeviceManagerState {
  public getDeviceIdFromStream = vi.fn(
    (stream) => stream.getTracks()[0].getSettings().deviceId,
  );
}

class TestInputMediaDeviceManager extends DeviceManager<TestInputMediaDeviceManagerState> {
  public getDevices = vi.fn(() => of(mockVideoDevices));
  public getStream = vi.fn(() => Promise.resolve(mockVideoStream()));
  public publishStream = vi.fn();
  public stopPublishStream = vi.fn();
  public getTracks = () => this.state.mediaStream?.getTracks() ?? [];

  constructor(call: Call) {
    super(
      call,
      new TestInputMediaDeviceManagerState(
        'stop-tracks',
        mockBrowserPermission,
      ),
      TrackType.VIDEO,
    );
  }
}

describe('MediaStream Filters', () => {
  let manager: TestInputMediaDeviceManager;

  beforeEach(() => {
    manager = new TestInputMediaDeviceManager(
      new Call({
        id: '',
        type: '',
        streamClient: new StreamClient('abc123'),
        clientStore: new StreamVideoWriteableStateStore(),
      }),
    );
  });

  it('should support registering and unregistering of filters', async () => {
    const mediaStream = new MediaStream();
    const track = new MediaStreamTrack();
    vi.spyOn(mediaStream, 'getTracks').mockReturnValue([track]);
    vi.spyOn(track, 'getSettings').mockReturnValue({ deviceId: '123' });
    const filter = vi.fn().mockReturnValue({ output: mediaStream });
    const { registered, unregister } = manager.registerFilter(filter);
    await registered;
    await manager.enable();

    expect(filter).toHaveBeenCalled();

    filter.mockClear();
    await unregister();
    await manager.enable();

    expect(filter).not.toHaveBeenCalled();
  });

  it('should chain media streams together', async () => {
    const createMediaStream = () => {
      let onEndedCapture: EventListener | null = null;
      const mediaStream = new MediaStream();
      const track = new MediaStreamTrack();
      vi.spyOn(mediaStream, 'getTracks').mockReturnValue([track]);
      vi.spyOn(track, 'getSettings').mockReturnValue({ deviceId: '123' });
      vi.spyOn(track, 'addEventListener').mockImplementation((_, fn) => {
        onEndedCapture = fn as EventListener;
      });
      track.dispatchEvent = (event: Event) => {
        if (onEndedCapture && event.type === 'ended') {
          onEndedCapture(event);
        }
        return true;
      };
      return mediaStream;
    };

    const rootMediaStream = createMediaStream();
    const filterMediaStream = createMediaStream();
    const filter1 = vi.fn().mockReturnValue({ output: rootMediaStream });
    const filter2 = vi.fn().mockReturnValue({ output: filterMediaStream });
    await manager.registerFilter(filter1).registered;
    await manager.registerFilter(filter2).registered;
    await manager.enable();

    expect(filter1).toHaveBeenCalled();
    expect(filter2).toHaveBeenCalled();

    // stopping should bubble up: filter -> root
    const rootSpy = vi.spyOn(rootMediaStream.getTracks()[0], 'stop');
    expect(rootSpy).not.toHaveBeenCalled();
    filterMediaStream.getTracks()[0].stop();
    expect(rootSpy).toHaveBeenCalled();

    // stopping should not bubble down: root -> filter
    const filterSpy = vi.spyOn(filterMediaStream.getTracks()[0], 'stop');
    rootMediaStream.getTracks()[0].stop();
    expect(filterSpy).not.toHaveBeenCalled();

    // simulate an abrupt ending of the track
    rootMediaStream.getTracks()[0].dispatchEvent(new Event('ended'));
    expect(filterSpy).toHaveBeenCalled();
  });
});
