import { of } from 'rxjs';
import { Call } from '../../Call';
import { StreamClient } from '../../coordinator/connection/client';
import { CallingState, StreamVideoWriteableStateStore } from '../../store';
import { InputMediaDeviceManager } from '../InputMediaDeviceManager';

import { afterEach, beforeEach, describe, vi, it, expect } from 'vitest';
import { mockAudioDevices, mockCall, mockVideoDevices } from './mocks';
import { getVideoStream } from '../devices';
import { TrackType } from '../../gen/video/sfu/models/models';

vi.mock('../devices.ts', () => {
  console.log('MOCKING devices API');
  return {
    disposeOfMediaStream: vi.fn(),
    getAudioDevices: vi.fn(() => {
      return of(mockAudioDevices);
    }),
    getAudioStream: vi.fn(() => Promise.resolve({})),
    getVideoDevices: vi.fn(() => {
      return of(mockVideoDevices);
    }),
    getVideoStream: vi.fn(() => Promise.resolve({})),
  };
});

vi.mock('../../Call.ts', () => {
  console.log('MOCKING Call');
  return {
    Call: vi.fn(() => mockCall()),
  };
});

describe('InputMediaDeviceManager', () => {
  let manager: InputMediaDeviceManager;

  describe('video', () => {
    beforeEach(() => {
      manager = new InputMediaDeviceManager(
        new Call({
          id: '',
          type: '',
          streamClient: new StreamClient('abc123'),
          clientStore: new StreamVideoWriteableStateStore(),
        }),
        'videoinput',
      );
    });

    it('list devices', () => {
      const spy = vi.fn();
      manager.listDevices().subscribe(spy);

      expect(spy).toHaveBeenCalledWith(mockVideoDevices);
    });

    it('enable camera - before joined to call', async () => {
      await manager.enable();

      expect(manager.state.mediaStream).toBeDefined();
      expect(manager.state.status).toBe('enabled');
    });

    it('enable camera - after joined to call', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;

      await manager.enable();

      expect(manager['call'].publishVideoStream).toHaveBeenCalledWith(
        manager.state.mediaStream,
      );
    });

    it('disable camera - before joined to call', async () => {
      await manager.disable();

      expect(manager.state.mediaStream).toBeUndefined();
      expect(manager.state.status).toBe('disabled');
    });

    it('disable camera - after joined to call', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;
      // @ts-expect-error
      manager.state.setMediaStream({});

      await manager.disable();

      expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.VIDEO);
    });

    it('toggle camera', async () => {
      vi.spyOn(manager, 'disable');
      vi.spyOn(manager, 'enable');

      manager.state.setMediaStream(undefined);
      await manager.toggle();

      expect(manager.enable).toHaveBeenCalled();

      await manager.toggle();

      expect(manager.disable).toHaveBeenCalled();
    });

    it('select device when camera is off', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;
      manager.state.setMediaStream(undefined);
      manager.state.setDevice(undefined);

      const deviceId = mockVideoDevices[0].deviceId;
      await manager.select(deviceId);

      expect(manager.state.selectedDevice).toBe(deviceId);
      expect(getVideoStream).not.toHaveBeenCalledWith();
      expect(manager['call'].publishVideoStream).not.toHaveBeenCalled();
    });

    it('select device when camera is on', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;
      // @ts-expect-error
      manager.state.setMediaStream({});
      manager.state.setDevice(undefined);

      const deviceId = mockVideoDevices[0].deviceId;
      await manager.select(deviceId);

      expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.VIDEO);
      expect(manager['call'].publishVideoStream).toHaveBeenCalledWith({});
    });
  });

  describe('audio', () => {
    beforeEach(() => {
      manager = new InputMediaDeviceManager(
        new Call({
          id: '',
          type: '',
          streamClient: new StreamClient('abc123'),
          clientStore: new StreamVideoWriteableStateStore(),
        }),
        'audioinput',
      );
    });

    it('list devices', () => {
      const spy = vi.fn();
      manager.listDevices().subscribe(spy);

      expect(spy).toHaveBeenCalledWith(mockAudioDevices);
    });

    it('enable microphone - before joined to call', async () => {
      await manager.enable();

      expect(manager.state.mediaStream).toBeDefined();
      expect(manager.state.status).toBe('enabled');
    });

    it('enable microphone - after joined to call', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;

      await manager.enable();

      expect(manager['call'].publishAudioStream).toHaveBeenCalledWith(
        manager.state.mediaStream,
      );
    });

    it('disable microphone - before joined to call', async () => {
      await manager.disable();

      expect(manager.state.mediaStream).toBeUndefined();
      expect(manager.state.status).toBe('disabled');
    });

    it('disable microphone - after joined to call', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;
      // @ts-expect-error
      manager.state.setMediaStream({});

      await manager.disable();

      expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.AUDIO);
    });

    it('toggle microphone', async () => {
      vi.spyOn(manager, 'disable');
      vi.spyOn(manager, 'enable');

      manager.state.setMediaStream(undefined);
      await manager.toggle();

      expect(manager.enable).toHaveBeenCalled();

      await manager.toggle();

      expect(manager.disable).toHaveBeenCalled();
    });

    it('select device when microphone is off', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;
      manager.state.setMediaStream(undefined);
      manager.state.setDevice(undefined);

      const deviceId = mockVideoDevices[0].deviceId;
      await manager.select(deviceId);

      expect(manager.state.selectedDevice).toBe(deviceId);
      expect(getVideoStream).not.toHaveBeenCalledWith();
      expect(manager['call'].publishAudioStream).not.toHaveBeenCalled();
    });

    it('select device when microphone is on', async () => {
      // @ts-expect-error
      manager['call'].state.callingState = CallingState.JOINED;
      // @ts-expect-error
      manager.state.setMediaStream({});
      manager.state.setDevice(undefined);

      const deviceId = mockVideoDevices[0].deviceId;
      await manager.select(deviceId);

      expect(manager['call'].stopPublish).toHaveBeenCalledWith(TrackType.AUDIO);
      expect(manager['call'].publishAudioStream).toHaveBeenCalledWith({});
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });
});
