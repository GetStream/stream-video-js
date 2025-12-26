import type { EventListener } from './EventManager';
import type { ManagableTask } from './utils/headlessTask';
import type { PermissionsResult } from './utils/permissions';

export interface ICallingxModule {
  get isOutcomingCallsEnabled(): boolean;

  get isNotificationsAllowed(): boolean;

  /**
   /**
    * Setup the module. This method must be called before any other method.
    * For iOS, the module will setup CallKit parameters.
    *    See: {@link InternalIOSOptions}
    * For Android, the module will create notification channels.
    *    See: {@link InternalAndroidOptions}
    * @param options - The options to setup the callingx module. See {@link Options}
    */
  setup(options: Options): void;
  /**
   * Set whether to reject calls when the user is busy.
   * The value is used in iOS native module to prevent calls registration in CallKit when the user is busy.
   * @param shouldReject - Whether to reject calls when the user is busy.
   */
  setShouldRejectCallWhenBusy(shouldReject: boolean): void;
  /**
   * Check the permissions.
   * @returns The permissions result.
   */
  checkPermissions(): Promise<PermissionsResult>;

  requestPermissions(): Promise<PermissionsResult>;
  /**
   * Get the initial events. This method is used to get the initial events from the app launch.
   * The events are queued and can be retrieved after the module is setup.
   * IMPORTANT: After the events are retrieved, new events will be sent to the event listeners.
   * @returns The initial events.
   */
  getInitialEvents(): EventData[];

  displayIncomingCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
    displayOptions?: InfoDisplayOptions,
  ): Promise<void>;
  answerIncomingCall(callId: string): Promise<void>;

  startCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
    displayOptions?: InfoDisplayOptions,
  ): Promise<void>;

  /**
   * Set the current call active. This method is used to set the current call active.
   * This method is used to activate the call that was registered with {@link startCall}.
   * @param callId - The call id.
   * @returns The promise.
   */
  setCurrentCallActive(callId: string): Promise<void>;

  updateDisplay(
    callId: string,
    phoneNumber: string,
    callerName: string,
    displayOptions?: InfoDisplayOptions,
  ): Promise<void>;

  /**
   * Check if the call is registered in CallKit/Telecom.
   * @param callId - The call id.
   * @returns The boolean value.
   */
  isCallRegistered(callId: string): boolean;

  /**
   * Check if there is a registered call.
   * @returns The boolean value.
   */
  hasRegisteredCall(): boolean;

  /**
   * End the call with a reason. This method is used to end the call with a reason.
   * Note: In general invoking this method will trigger the call end event.
   * But, in case of iOS, when the call is ended with the reason 'local', the call end event will not be triggered.
   * @param callId - The call id.
   * @param reason - The reason.
   * @returns The promise.
   */
  endCallWithReason(callId: string, reason: EndCallReason): Promise<void>;

  setMutedCall(callId: string, isMuted: boolean): Promise<void>;

  setOnHoldCall(callId: string, isOnHold: boolean): Promise<void>;

  startBackgroundTask(taskProvider: ManagableTask): Promise<void>;

  stopBackgroundTask(taskName: string): Promise<void>;

  addEventListener<T extends EventName>(
    eventName: T,
    callback: EventListener<EventParams[T]>,
  ): { remove: () => void };

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void;
}

export type InternalIOSOptions = {
  supportsVideo?: boolean;
  maximumCallsPerCallGroup?: number;
  maximumCallGroups?: number;
  handleType?: 'generic' | 'number' | 'phone' | 'email';
  /**
   * Sound to play when an incoming call is received. Must be a valid sound resource name in the project.
   * @default '' (no sound)
   */
  sound?: string;
  /**
   * Image to display when an incoming call is received. Must be a valid image resource name in the project.
   * @default '' (no image)
   */
  imageName?: string;
  /**
   * Enable calls history. When enabled, the call will be added to the calls history.
   * @default false
   */
  callsHistory?: boolean;
  /**
   * Enable default audio session setup. When enabled, the module will setup the audio session.
   * @default true
   */
  setupAudioSession?: boolean;
  /**
   * Timeout to display an incoming call. When the call is displayed for more than the timeout, the call will be rejected.
   * @default 60000 (1 minute)
   */
  displayCallTimeout?: number;
};
type iOSOptions = Omit<
  InternalIOSOptions,
  | 'maximumCallsPerCallGroup'
  | 'maximumCallGroups'
  | 'handleType'
  | 'setupAudioSession'
>;

export type InternalAndroidOptions = {
  /**
   * Incoming channel configuration.
   * @default { id: 'incoming_calls_channel', name: 'Incoming calls', sound: '', vibration: false }
   */
  incomingChannel?: {
    id?: string;
    name?: string;
    sound?: string;
    vibration?: boolean;
  };
  /**
   * Outgoing channel configuration.
   * @default { id: 'ongoing_calls_channel', name: 'Ongoing calls' }
   */
  outgoingChannel?: {
    id?: string;
    name?: string;
  };
};
type AndroidOptions = InternalAndroidOptions & NotificationTransformers;

export type TextTransformer = (text: string, incoming: boolean) => string;
export type NotificationTransformers = {
  titleTransformer?: TextTransformer;
  subtitleTransformer?: TextTransformer;
};

export type Options = {
  ios?: iOSOptions;
  android?: AndroidOptions;
  /**
   * Enable outgoing calls registration
   * @default true
   */
  enableOutcomingCalls?: boolean;
  /**
   * Enable auto permissions request on setup call
   * @default true
   */
  enableAutoPermissions?: boolean;
  /**
   * Whether to reject calls when the user is busy.
   * @default false
   */
  shouldRejectCallWhenBusy?: boolean;
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
