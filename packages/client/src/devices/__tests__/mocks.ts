import { vi } from 'vitest';
import { CallingState } from '../../store';

export const mockVideoDevices = [
  {
    deviceId:
      '9d7b77d613cc935c023c08779a714db96e9f6d5589aae20869b5ab6e42f5b1fe',
    kind: 'videoinput',
    label: 'Logi Capture',
    groupId: '81b3a3c5fec920079136100dc4b185209859077ce622a24fec747406d50cd694',
  },
  {
    deviceId:
      'af5cbd8fa1ff57b16f5f3c2c03dd9502f552cbdada3992a5c10b8d240debf1b5',
    kind: 'videoinput',
    label: 'HD Pro Webcam C920 (046d:08e5)',
    groupId: 'bb0a866e4d66d493a104d7bd5a5dc2fee3d5947fab34aa0a99282386556a8f17',
  },
  {
    deviceId:
      'f66cf2801fa16223e46a65be7d8d98d23670dd16fdd8961dd5c0dbb0cad372f3',
    kind: 'videoinput',
    label: 'FaceTime HD Camera (Built-in) (05ac:8514)',
    groupId: '0387adca5bc7ab2850a9b9594a5622d838de4f78cbdf4d31c3506b701c58d94d',
  },
] as MediaDeviceInfo[];

export const mockAudioDevices = [
  {
    deviceId: 'default',
    kind: 'audioinput',
    label: 'Default - MacBook Pro Microphone (Built-in)',
    groupId: 'a8708545cb3969c0b7e3712d2ffdbc381992aeb5577b06cd71ba7a94ee20cf3e',
  },
  {
    deviceId:
      '6ce9fde261809389d6476791d329695ea4c98bd432ac5f6a60e7017c96943d32',
    kind: 'audioinput',
    label: 'iPhone Microphone',
    groupId: '65a8661fe6575d0eb180e7ab3f1ec887a285965293b9e75ceed938766f6d32bd',
  },
  {
    deviceId:
      'bb784adda6f0199966c97f8a2ca0fb93169e55cae050e8e8dd4ef76ffd1e638d',
    kind: 'audioinput',
    label: 'HD Pro Webcam C920 (046d:08e5)',
    groupId: 'bb0a866e4d66d493a104d7bd5a5dc2fee3d5947fab34aa0a99282386556a8f17',
  },
  {
    deviceId:
      '45b2467601574a522fe96048a5b2122ea6be0a478e04b990eaa4d93b49e2428a',
    kind: 'audioinput',
    label: 'MacBook Pro Microphone (Built-in)',
    groupId: 'a8708545cb3969c0b7e3712d2ffdbc381992aeb5577b06cd71ba7a94ee20cf3e',
  },
  {
    deviceId:
      'b936c0572d3536857d646af780b8704c368a872e7ba8138ef83d72d726710975',
    kind: 'audioinput',
    label: 'ZoomAudioDevice (Virtual)',
    groupId: '423bb83eab8607fe47313f2e0307600c40e03c37ad63a3b8412d3d5eb0671a55',
  },
] as MediaDeviceInfo[];

export const mockCall = () => {
  return {
    state: {
      callingState: CallingState.IDLE,
    },
    publishVideoStream: vi.fn(),
    publishAudioStream: vi.fn(),
    stopPublish: vi.fn(),
  };
};

export const mockAudioStream = () => {
  const track = {
    getSettings: () => ({
      deviceId: mockAudioDevices[0].deviceId,
    }),
    enabled: true,
  };
  return {
    getAudioTracks: () => [track],
  } as MediaStream;
};

export const mockVideoStream = () => {
  const track = {
    getSettings: () => ({
      deviceId: mockVideoDevices[0].deviceId,
      width: 1280,
      height: 720,
    }),
    enabled: true,
  };
  return {
    getVideoTracks: () => [track],
  } as MediaStream;
};
