import type { EventListener } from './EventManager';
import type { ManagableTask } from './utils/headlessTask';
import type { PermissionsResult } from './utils/permissions';

export interface ICallingxModule {
  get isOutcomingCallsEnabled(): boolean;

  get isNotificationsAllowed(): boolean;

  setup(options: Options): void;

  setShouldRejectCallWhenBusy(shouldReject: boolean): void;

  checkPermissions(): Promise<PermissionsResult>;

  requestPermissions(): Promise<PermissionsResult>;

  setCurrentCallActive(callId: string): Promise<void>;

  getInitialEvents(): EventData[];

  displayIncomingCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
    displayOptions?: InfoDisplayOptions
  ): Promise<void>;
  answerIncomingCall(callId: string): Promise<void>;

  startCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
    displayOptions?: InfoDisplayOptions
  ): Promise<void>;

  updateDisplay(
    callId: string,
    phoneNumber: string,
    callerName: string,
    displayOptions?: InfoDisplayOptions
  ): Promise<void>;

  isCallRegistered(callId: string): boolean;

  hasRegisteredCall(): boolean;

  endCallWithReason(callId: string, reason: EndCallReason): Promise<void>;

  setMutedCall(callId: string, isMuted: boolean): Promise<void>;

  setOnHoldCall(callId: string, isOnHold: boolean): Promise<void>;

  startBackgroundTask(taskProvider: ManagableTask): Promise<void>;

  stopBackgroundTask(taskName: string): Promise<void>;

  addEventListener<T extends EventName>(
    eventName: T,
    callback: EventListener<EventParams[T]>
  ): { remove: () => void };

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void;
}

export type iOSOptions = {
  supportsVideo?: boolean;
  maximumCallsPerCallGroup?: number;
  maximumCallGroups?: number;
  handleType?: string; //'generic' | 'number' | 'phone' | 'email';
  sound?: string;
  imageName?: string;
  callsHistory?: boolean;
  setupAudioSession?: boolean;
};

export type AndroidOptions = {
  incomingChannel?: {
    id?: string;
    name?: string;
    sound?: string;
    vibration?: boolean;
  };
  outgoingChannel?: {
    id?: string;
    name?: string;
  };
};

export type TextTransformer = (text: string, incoming: boolean) => string;
export type NotificationTransformers = {
  titleTransformer: TextTransformer;
  subtitleTransformer?: TextTransformer;
};

export type Options = {
  ios?: iOSOptions;
  android?: AndroidOptions & NotificationTransformers;
  enableOutcomingCalls?: boolean;
  enableAutoPermissions?: boolean;
};

export type InfoDisplayOptions = {
  displayTitle?: string;
  displaySubtitle?: string;
};

export type EventData = {
  eventName: EventName;
  params: EventParams[EventName];
};

export type EventName =
  | 'answerCall'
  | 'endCall'
  | 'didDisplayIncomingCall'
  | 'didToggleHoldCallAction'
  | 'didChangeAudioRoute'
  | 'didReceiveStartCallAction'
  | 'didPerformSetMutedCallAction'
  | 'didActivateAudioSession'
  | 'didDeactivateAudioSession';

export type EventParams = {
  answerCall: {
    callId: string;
    source: 'app' | 'sys';
  };
  endCall: {
    callId: string;
    cause: string;
    source: 'app' | 'sys';
  };
  didDisplayIncomingCall: {
    callId: string;
  };
  didToggleHoldCallAction: {
    callId: string;
    hold: boolean;
  };
  didPerformSetMutedCallAction: {
    callId: string;
    muted: boolean;
  };
  didChangeAudioRoute: {
    callId: string;
    output: string;
  };
  didReceiveStartCallAction: {
    callId: string;
  };
  didActivateAudioSession: undefined;
  didDeactivateAudioSession: undefined;
};

export type EndCallReason =
  | 'local' // when call is ended by the user
  | 'remote'
  | 'rejected'
  | 'busy'
  | 'answeredElsewhere'
  | 'missed'
  | 'error';
