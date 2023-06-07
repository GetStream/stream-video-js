import { SfuEvent } from '@stream-io/video-client/dist/src/gen/video/sfu/event/events';

type BinaryType = 'arraybuffer' | 'blob';
export type RTCDataChannelState = 'closed' | 'closing' | 'connecting' | 'open';

export type RTCConfiguration = {
  iceServers?: {
    urls: string | string[];
    username?: string;
    credential?: string;
  }[];
};

export interface MessageEvent<T = any> extends Event {
  /** Returns the data of the message. */
  readonly data: T;
  /** Returns the last event ID string, for server-sent events. */
  readonly lastEventId: string;
  /** Returns the origin of the message, for server-sent events and cross-document messaging. */
  readonly origin: string;
  /** Returns the MessagePort array sent with the message, for cross-document messaging and channel messaging. */
  readonly ports: any;
  /** Returns the WindowProxy of the source window, for cross-document messaging, and the MessagePort being attached, in the connect event fired at SharedWorkerGlobalScope objects. */
  readonly source: any;
  /** @deprecated */
  initMessageEvent(
    type: string,
    bubbles?: boolean,
    cancelable?: boolean,
    data?: any,
    origin?: string,
    lastEventId?: string,
    source?: any,
    ports?: any[],
  ): void;
}

interface RTCDataChannelEventMap {
  bufferedamountlow: Event;
  close: Event;
  closing: Event;
  error: Event;
  message: MessageEvent;
  open: Event;
}

interface EventListener {
  (evt: Event): void;
}

interface EventListenerObject {
  handleEvent(object: Event): void;
}

type EventListenerOrEventListenerObject = EventListener | EventListenerObject;

interface EventListenerOptions {
  capture?: boolean;
}

interface AddEventListenerOptions extends EventListenerOptions {
  once?: boolean;
  passive?: boolean;
  signal?: AbortSignal;
}

export interface RTCDataChannel extends EventTarget {
  binaryType: BinaryType;
  readonly bufferedAmount: number;
  bufferedAmountLowThreshold: number;
  readonly id: number | null;
  readonly label: string;
  readonly maxPacketLifeTime: number | null;
  readonly maxRetransmits: number | null;
  readonly negotiated: boolean;
  readonly ordered: boolean;
  readonly protocol: string;
  readonly readyState: RTCDataChannelState;

  close(): void;

  send(data: string): void;

  send(data: Blob): void;

  send(data: ArrayBuffer): void;

  send(data: ArrayBufferView): void;

  addEventListener<K extends keyof RTCDataChannelEventMap>(
    type: K,
    listener: (this: RTCDataChannel, ev: RTCDataChannelEventMap[K]) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;

  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ): void;

  removeEventListener<K extends keyof RTCDataChannelEventMap>(
    type: K,
    listener: (this: RTCDataChannel, ev: RTCDataChannelEventMap[K]) => any,
    options?: boolean | EventListenerOptions,
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions,
  ): void;
}

export type EventHandler = (event: SfuEvent) => void;

export type GuestMeetingScreenParams = {
  guestUserId?: string;
  guestCallId: string;
  mode: string;
};

export type LoginStackParamList = {
  ChooseFlowScreen: undefined;
  LoginScreen: undefined;
};

export type MeetingStackParamList = {
  JoinMeetingScreen: undefined;
  MeetingScreen: { callId: string };
  GuestModeScreen: { callId: string };
  GuestMeetingScreen: GuestMeetingScreenParams;
};

export type RootStackParamList = {
  Login: undefined;
  Meeting: undefined;
  Call: undefined;
};

export type ScreenTypes =
  | 'lobby'
  | 'error-join'
  | 'error-leave'
  | 'loading'
  | 'active-call';
