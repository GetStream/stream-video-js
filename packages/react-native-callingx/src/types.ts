import type { EventListener } from './EventManager';
import type { ManagableTask } from './utils/headlessTask';

export interface ICallingxModule {
  /**
   * Whether the module can post call notifications. Android only. iOS always returns true.
   * Returns true when:
   * - The incoming notification channel is enabled,
   * - The ongoing notification channel is enabled,
   * - And on Android 12 and below: app notifications are enabled in system settings.
   * CallStyle is exempt from the POST_NOTIFICATIONS permission on Android 13+ when self-managing calls.
   * @returns The boolean value.
   */
  get canPostNotifications(): boolean;
  get isOngoingCallsEnabled(): boolean;
  get isSetup(): boolean;

  /**
   * Setup the module. This method must be called before any other method.
   * For iOS, the module will setup CallKit parameters.
   *    See: {@link InternalIOSOptions}
   * For Android, the module will create notification channels.
   *    See: {@link InternalAndroidOptions}
   * @param options - The options to setup the callingx module. See {@link CallingExpOptions}
   */
  setup(options: CallingExpOptions): void;
  /**
   * Set whether to reject calls when the user is busy.
   * The value is used in iOS native module to prevent calls registration in CallKit when the user is busy.
   * @param shouldReject - Whether to reject calls when the user is busy.
   */
  setShouldRejectCallWhenBusy(shouldReject: boolean): void;
  /**
   * Get the initial events. This method is used to get the initial events from the app launch.
   * The events are queued and can be retrieved after the module is setup.
   * IMPORTANT: After the events are retrieved, new events will be sent to the event listeners.
   * @returns The initial events.
   */
  getInitialEvents(): EventData[];

  /**
   * Get the initial voip events. This method is used to get the initial voip events from the app launch.
   * The events are queued and can be retrieved after the module is setup.
   * IMPORTANT: After the events are retrieved, new events will be sent to the event listeners.
   * @returns The initial voip events.
   */
  getInitialVoipEvents(): VoipEventData[];

  displayIncomingCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
  ): Promise<void>;
  answerIncomingCall(callId: string): Promise<void>;

  startCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
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

  /**
   * Register a background task provider. This method only registers the task and does not start it.
   * The task will be automatically started when the service starts (via displayIncomingCall or startCall)
   * if it has been registered.
   * @param taskProvider - The task provider function that will be executed when the background task starts.
   */
  registerBackgroundTask(taskProvider: ManagableTask): void;

  /**
   * Start the background task. This method will only start the task if:
   * 1. A background task has been registered via registerBackgroundTask
   * 2. The service is currently started
   * @param taskProvider - The task provider function. If not provided, uses the previously registered task.
   * @returns Promise that resolves when the task is started, or rejects if conditions are not met.
   */
  startBackgroundTask(taskProvider?: ManagableTask): Promise<void>;

  stopBackgroundTask(taskName: string): Promise<void>;

  registerVoipToken(): void;

  /**
   * Single entry point for adding event listeners.
   * Automatically routes to the appropriate manager based on event type.
   *
   * @param eventName - The event name (EventName or VoipEventName)
   * @param callback - The callback function that receives the event parameters
   * @returns An object with a remove method to unsubscribe from the event
   */
  addEventListener<T extends EventName | VoipEventName>(
    eventName: T,
    callback: EventListener<
      T extends EventName
        ? EventParams[T]
        : T extends VoipEventName
          ? VoipEventParams[T]
          : never
    >,
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
   * Ongoing channel configuration.
   * @default { id: 'ongoing_calls_channel', name: 'Ongoing calls' }
   */
  ongoingChannel?: {
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

export type CallingExpOptions = {
  ios?: iOSOptions;
  android?: AndroidOptions;
  /**
   * Whether to enable ongoing calls.
   * @default false
   */
  enableOngoingCalls?: boolean;
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

export type VoipEventData = {
  eventName: VoipEventName;
  params: VoipEventParams[VoipEventName];
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

export type VoipEventName =
  | 'voipNotificationsRegistered'
  | 'voipNotificationReceived';

export type VoipEventParams = {
  voipNotificationsRegistered: {
    token: string;
  };
  voipNotificationReceived: {
    aps: {
      'thread-id': string;
      'mutable-content': number;
      alert: {
        title: string;
      };
      category: string;
      sound: string;
    };
    stream: {
      sender: string;
      created_by_id: string;
      body: string;
      title: string;
      call_display_name: string;
      created_by_display_name: string;
      version: string;
      type: string;
      receiver_id: string;
      call_cid: string;
      video: string;
    };
  };
};

/**
 * The reason for ending a call. These values are mapped to platform-specific
 * constants on each platform:
 * - iOS: `CXCallEndedReason` (CallKit)
 * - Android: `DisconnectCause` (Telecom)
 *
 * @see https://developer.apple.com/documentation/callkit/cxcallendedreason
 * @see https://developer.android.com/reference/android/telecom/DisconnectCause
 */
export type EndCallReason =
  /** Call ended by the local user (e.g., hanging up). */
  | 'local'
  /** Call ended by the remote party, or outgoing call was not answered. */
  | 'remote'
  /** Call was rejected/declined by the user. */
  | 'rejected'
  /** Remote party was busy. */
  | 'busy'
  /** Call was answered on another device. */
  | 'answeredElsewhere'
  /** No response to an incoming call. */
  | 'missed'
  /** Call failed due to an error (e.g., network issue). */
  | 'error'
  /** Call was canceled before the remote party could answer. */
  | 'canceled'
  /** Call restricted (e.g., airplane mode, dialing restrictions). */
  | 'restricted'
  /** Unknown or unspecified disconnect reason. */
  | 'unknown';
