import { View, ViewProps } from 'react-native';
import { ComponentTestIds } from '../../src/constants/TestIds';

export const MediaStream = undefined;

interface MockProps extends ViewProps {
  mirror?: boolean;
  objectFit?: 'contain' | 'cover';
  streamURL: string;
  zOrder?: number;
}

// Override and mock RTCView with a regular View to mimic the behavior of the
// react-native-webrtc video component.
export const RTCView = (props: MockProps) => (
  <View testID={ComponentTestIds.PARTICIPANT_MEDIA_STREAM} {...props} />
);

export const registerGlobals = () => {};

export enum RTCEncryptionAlgorithm {
  AES_128_GCM = 0,
  AES_256_GCM = 1,
}

export enum RTCEncryptionTrackType {
  AUDIO = 0,
  VIDEO = 1,
  SCREEN_SHARE = 2,
  SCREEN_SHARE_AUDIO = 3,
}

type Listener = (data: any) => void;

/**
 * Stand-in for the native manager. Records calls, and lets a test push an event
 * through the same listener registry the real bridge uses.
 */
export class RTCEncryptionManager {
  static supported = true;
  static instances: RTCEncryptionManager[] = [];

  static isSupported = jest.fn(() => RTCEncryptionManager.supported);
  static create = jest.fn(
    (userId: string, options?: { algorithm?: number }) =>
      new RTCEncryptionManager(userId, options),
  );

  userId: string;
  options?: { algorithm?: number };
  listeners = new Map<string, Set<Listener>>();

  setKey = jest.fn();
  setSharedKey = jest.fn();
  removeKey = jest.fn();
  removeAllKeys = jest.fn();
  removeSharedKey = jest.fn();
  encrypt = jest.fn();
  decrypt = jest.fn();
  enablePerformanceReporting = jest.fn(() => Promise.resolve());
  requestKeyState = jest.fn(() => Promise.resolve());
  dispose = jest.fn();

  constructor(userId: string, options?: { algorithm?: number }) {
    this.userId = userId;
    this.options = options;
    RTCEncryptionManager.instances.push(this);
  }

  on = jest.fn((type: string, listener: Listener) => {
    let listeners = this.listeners.get(type);
    if (!listeners) {
      listeners = new Set();
      this.listeners.set(type, listeners);
    }
    listeners.add(listener);
  });

  off = jest.fn((type: string, listener: Listener) => {
    this.listeners.get(type)?.delete(listener);
  });

  /** Test hook: emit a native event payload to every listener of its type. */
  emitNative(data: { type: string; [key: string]: unknown }) {
    this.listeners.get(data.type)?.forEach((listener) => listener(data));
  }
}
