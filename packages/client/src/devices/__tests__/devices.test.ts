/* @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { firstValueFrom, of, skip } from 'rxjs';

const permissionInstances: Array<{
  prompt: ReturnType<typeof vi.fn>;
}> = [];

vi.mock('../BrowserPermission', () => {
  class BrowserPermission {
    prompt = vi.fn(async () => true);
    asObservable = vi.fn(() => of(true));
    asStateObservable = vi.fn(() => of('granted'));
    getIsPromptingObservable = vi.fn(() => of(false));

    constructor() {
      permissionInstances.push(this);
    }
  }
  return { BrowserPermission };
});

vi.mock('../../helpers/browsers', () => ({
  isSafari: vi.fn(),
  isFirefox: vi.fn(),
}));

type MediaDevicesMock = MediaDevices &
  EventTarget & {
    enumerateDevices: ReturnType<typeof vi.fn>;
    getUserMedia: ReturnType<typeof vi.fn>;
    getDisplayMedia: ReturnType<typeof vi.fn>;
  };

const setupMediaDevices = (
  overrides: Partial<MediaDevices> = {},
): MediaDevicesMock => {
  const eventTarget = new EventTarget();
  const mediaDevices = Object.assign(eventTarget, {
    enumerateDevices: vi.fn(async () => []),
    getUserMedia: vi.fn(async () => ({}) as MediaStream),
    getDisplayMedia: vi.fn(async () => ({}) as MediaStream),
    ...overrides,
  }) as MediaDevicesMock;

  Object.defineProperty(globalThis, 'navigator', {
    configurable: true,
    value: { mediaDevices },
  });

  return mediaDevices;
};

const loadDevicesModule = async () => {
  vi.resetModules();
  return await import('../devices');
};

describe('devices', () => {
  beforeEach(() => {
    permissionInstances.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('checkIfAudioOutputChangeSupported uses audio element when not Safari', async () => {
    setupMediaDevices();
    const { checkIfAudioOutputChangeSupported } = await loadDevicesModule();
    const browsers = await import('../../helpers/browsers');
    vi.mocked(browsers.isSafari).mockReturnValue(false);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockReturnValue({ setSinkId: vi.fn() } as unknown as HTMLMediaElement);

    expect(checkIfAudioOutputChangeSupported()).toBe(true);
    expect(createElementSpy).toHaveBeenCalledWith('audio');
  });

  it('checkIfAudioOutputChangeSupported uses AudioContext in Safari', async () => {
    setupMediaDevices();
    class AudioContextStub {}
    (
      AudioContextStub.prototype as { setSinkId?: () => Promise<void> }
    ).setSinkId = vi.fn();
    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: AudioContextStub as typeof AudioContext,
    });

    const { checkIfAudioOutputChangeSupported } = await loadDevicesModule();
    const browsers = await import('../../helpers/browsers');
    vi.mocked(browsers.isSafari).mockReturnValue(true);
    expect(checkIfAudioOutputChangeSupported()).toBe(true);
  });

  it('getAudioDevices prompts and filters devices', async () => {
    const mediaDevices = setupMediaDevices({
      enumerateDevices: vi
        .fn()
        .mockResolvedValueOnce([
          { kind: 'audioinput', label: '', deviceId: 'id-1', groupId: 'g1' },
          {
            kind: 'audioinput',
            label: 'Default device',
            deviceId: 'default',
            groupId: 'g1',
          },
        ])
        .mockResolvedValueOnce([
          {
            kind: 'audioinput',
            label: 'Mic 1',
            deviceId: 'id-1',
            groupId: 'g1',
          },
          {
            kind: 'audioinput',
            label: 'Mic 2',
            deviceId: 'id-2',
            groupId: 'g2',
          },
        ]),
    });

    const { getAudioDevices } = await loadDevicesModule();
    const devices = await firstValueFrom(getAudioDevices());

    expect(
      vi.mocked(mediaDevices.enumerateDevices).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    expect(permissionInstances[0].prompt).toHaveBeenCalled();
    expect(devices).toEqual([
      { kind: 'audioinput', label: 'Mic 1', deviceId: 'id-1', groupId: 'g1' },
      { kind: 'audioinput', label: 'Mic 2', deviceId: 'id-2', groupId: 'g2' },
    ]);
  });

  it('getVideoDevices prompts and filters devices', async () => {
    const mediaDevices = setupMediaDevices({
      enumerateDevices: vi
        .fn()
        .mockResolvedValueOnce([
          { kind: 'videoinput', label: '', deviceId: 'id-1', groupId: 'g1' },
          {
            kind: 'videoinput',
            label: 'Default camera',
            deviceId: 'default',
            groupId: 'g1',
          },
        ])
        .mockResolvedValueOnce([
          {
            kind: 'videoinput',
            label: 'Cam 1',
            deviceId: 'id-1',
            groupId: 'g1',
          },
          {
            kind: 'videoinput',
            label: 'Cam 2',
            deviceId: 'id-2',
            groupId: 'g2',
          },
        ]),
    });

    const { getVideoDevices } = await loadDevicesModule();
    const devices = await firstValueFrom(getVideoDevices());

    expect(
      vi.mocked(mediaDevices.enumerateDevices).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    expect(permissionInstances[0].prompt).toHaveBeenCalled();
    expect(devices).toEqual([
      { kind: 'videoinput', label: 'Cam 1', deviceId: 'id-1', groupId: 'g1' },
      { kind: 'videoinput', label: 'Cam 2', deviceId: 'id-2', groupId: 'g2' },
    ]);
  });

  it('getAudioOutputDevices prompts and filters devices', async () => {
    const mediaDevices = setupMediaDevices({
      enumerateDevices: vi
        .fn()
        .mockResolvedValueOnce([
          { kind: 'audiooutput', label: '', deviceId: 'id-1', groupId: 'g1' },
          {
            kind: 'audiooutput',
            label: 'Default speaker',
            deviceId: 'default',
            groupId: 'g1',
          },
        ])
        .mockResolvedValueOnce([
          {
            kind: 'audiooutput',
            label: 'Speaker 1',
            deviceId: 'id-1',
            groupId: 'g1',
          },
          {
            kind: 'audiooutput',
            label: 'Speaker 2',
            deviceId: 'id-2',
            groupId: 'g2',
          },
        ]),
    });

    const { getAudioOutputDevices } = await loadDevicesModule();
    const devices = await firstValueFrom(getAudioOutputDevices());

    expect(
      vi.mocked(mediaDevices.enumerateDevices).mock.calls.length,
    ).toBeGreaterThanOrEqual(2);
    expect(permissionInstances[0].prompt).toHaveBeenCalled();
    expect(devices).toEqual([
      {
        kind: 'audiooutput',
        label: 'Speaker 1',
        deviceId: 'id-1',
        groupId: 'g1',
      },
      {
        kind: 'audiooutput',
        label: 'Speaker 2',
        deviceId: 'id-2',
        groupId: 'g2',
      },
    ]);
  });

  it('getAudioStream retries with relaxed constraints when deviceId fails', async () => {
    const stream = {
      getVideoTracks: () => [],
      getAudioTracks: () => [],
    } as MediaStream;
    const mediaDevices = setupMediaDevices({
      getUserMedia: vi
        .fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('fail'), { name: 'OverconstrainedError' }),
        )
        .mockResolvedValueOnce(stream),
    });

    const { getAudioStream } = await loadDevicesModule();
    await getAudioStream({ deviceId: { exact: 'mic-1' } });

    expect(mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    const calls = vi.mocked(mediaDevices.getUserMedia).mock.calls;
    const firstCall = calls[0][0];
    const secondCall = calls[1][0];
    expect(firstCall.audio.deviceId).toEqual({ exact: 'mic-1' });
    expect(secondCall.audio.deviceId).toBeUndefined();
  });

  it('getVideoStream triggers devicechange on Firefox', async () => {
    const stream = {
      getVideoTracks: () => [
        { getSettings: () => ({ width: 1280, height: 720 }) },
      ],
      getAudioTracks: () => [],
    } as MediaStream;
    const mediaDevices = setupMediaDevices({
      getUserMedia: vi.fn().mockResolvedValue(stream),
    });

    const { getVideoStream } = await loadDevicesModule();
    const dispatchEventSpy = vi.spyOn(mediaDevices, 'dispatchEvent');
    const browsers = await import('../../helpers/browsers');
    vi.mocked(browsers.isFirefox).mockReturnValue(true);
    await getVideoStream();

    expect(dispatchEventSpy).toHaveBeenCalledWith(expect.any(Event));
  });

  it('getVideoStream retries with relaxed constraints when deviceId fails', async () => {
    const stream = {
      getVideoTracks: () => [
        { getSettings: () => ({ width: 1280, height: 720 }) },
      ],
      getAudioTracks: () => [],
    } as MediaStream;
    const mediaDevices = setupMediaDevices({
      getUserMedia: vi
        .fn()
        .mockRejectedValueOnce(
          Object.assign(new Error('fail'), { name: 'NotFoundError' }),
        )
        .mockResolvedValueOnce(stream),
    });

    const { getVideoStream } = await loadDevicesModule();
    await getVideoStream({ deviceId: { exact: 'cam-1' } });

    const calls = vi.mocked(mediaDevices.getUserMedia).mock.calls;
    expect(calls.length).toBe(2);
    expect(calls[0][0].video.deviceId).toEqual({ exact: 'cam-1' });
    expect(calls[1][0].video.deviceId).toBeUndefined();
  });

  it('getScreenShareStream propagates getDisplayMedia errors', async () => {
    const error = new Error('denied');
    const mediaDevices = setupMediaDevices({
      getDisplayMedia: vi.fn().mockRejectedValueOnce(error),
    });

    const { getScreenShareStream } = await loadDevicesModule();
    await expect(getScreenShareStream()).rejects.toBe(error);
    expect(mediaDevices.getDisplayMedia).toHaveBeenCalledOnce();
  });

  it('deviceIds$ emits enumerated devices and reacts to devicechange', async () => {
    vi.useFakeTimers();
    const mediaDevices = setupMediaDevices({
      enumerateDevices: vi
        .fn()
        .mockResolvedValueOnce([
          {
            kind: 'audioinput',
            label: 'Mic 1',
            deviceId: 'mic-1',
            groupId: 'g1',
          },
        ])
        .mockResolvedValueOnce([
          {
            kind: 'audioinput',
            label: 'Mic 2',
            deviceId: 'mic-2',
            groupId: 'g2',
          },
        ]),
    });

    const { deviceIds$ } = await loadDevicesModule();
    const first = await firstValueFrom(deviceIds$!);
    expect(first).toEqual([
      {
        kind: 'audioinput',
        label: 'Mic 1',
        deviceId: 'mic-1',
        groupId: 'g1',
      },
    ]);

    const nextValue = firstValueFrom(deviceIds$!.pipe(skip(1)));
    mediaDevices.dispatchEvent(new Event('devicechange'));
    await vi.advanceTimersByTimeAsync(500);
    const second = await nextValue;
    expect(second).toEqual([
      {
        kind: 'audioinput',
        label: 'Mic 2',
        deviceId: 'mic-2',
        groupId: 'g2',
      },
    ]);
    vi.useRealTimers();
  });

  it('resolveDeviceId resolves default device by group id', async () => {
    const devices = [
      {
        kind: 'audioinput',
        label: 'Default',
        deviceId: 'default',
        groupId: 'group-1',
      },
      {
        kind: 'audioinput',
        label: 'Mic 1',
        deviceId: 'mic-1',
        groupId: 'group-1',
      },
    ] as MediaDeviceInfo[];

    setupMediaDevices({
      enumerateDevices: vi.fn(async () => devices),
    });

    const { deviceIds$, resolveDeviceId } = await loadDevicesModule();
    await firstValueFrom(deviceIds$!);

    expect(resolveDeviceId('default', 'audioinput')).toBe('mic-1');
  });
});
