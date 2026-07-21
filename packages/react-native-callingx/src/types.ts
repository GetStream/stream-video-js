import type { EventListener } from './EventManager';

export type DefaultDeviceEndpointType = 'speaker' | 'earpiece';

/** Generic Telecom audio endpoint type names (Android). */
export type AudioEndpointType =
  | 'earpiece'
  | 'speaker'
  | 'wired_headset'
  | 'bluetooth'
  | 'unknown';

/** A single Telecom audio endpoint. `id` is opaque and passed back to select it. */
export type AudioEndpoint = {
  id: string;
  name: string;
  type: AudioEndpointType;
};

/** Snapshot of the Telecom audio endpoints for a call. */
export type AudioEndpointsSnapshot = {
  endpoints: AudioEndpoint[];
  currentEndpoint: AudioEndpoint | null;
};

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
   * Whether audio routing on this device is backed by the Jetpack Telecom stack.
   * Android: true on API 26+. iOS: always false.
   */
  get isTelecomBacked(): boolean;

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
   * Set the default audio endpoint applied when the OS activates the call's audio session.
   * - iOS: applied next time CallKit activates the session.
   * - Android (Telecom): applied once when the call becomes active and no wired/bluetooth
   *   device is connected.
   * Sticky preference.
   */
  setDefaultAudioDeviceEndpointType(
    endpointType: DefaultDeviceEndpointType,
  ): void;

  /**
   * Call ids currently registered with the native calling module (Android Telecom).
   * Empty on iOS.
   */
  getRegisteredCallIds(): string[];

  /**
   * Get the current Telecom audio endpoints for a call (Android). On iOS / unknown call,
   * resolves an empty snapshot.
   */
  getAvailableAudioEndpoints(callId: string): Promise<AudioEndpointsSnapshot>;

  /**
   * Request a Telecom audio-endpoint change by endpoint id (Android). No-op on iOS.
   */
  requestAudioEndpointChange(callId: string, endpointId: string): Promise<void>;
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
    incoming: boolean,
  ): Promise<void>;

  /**
   * Check if the call is tracked in the native calling module.
   * @param callId - The call id.
   * @returns The boolean value.
   */
  isCallTracked(callId: string): boolean;

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
   * Acquire a ref-counted background keep-alive task identified by [owner].
   *
   * The underlying HeadlessJS task — which keeps React Native's JS runtime and timers alive while
   * the app is backgrounded — is started on the first acquire and stopped only once the last owner
   * releases. Multiple independent owners (e.g. ringing-push handling and the keep-call-alive hook)
   * can hold it simultaneously without tearing down each other's task. No-op on iOS.
   * @param owner - A stable, unique key identifying the holder (e.g. `push:<cid>`, `keepalive:<cid>`).
   */
  acquireBackgroundTask(owner: string): Promise<void>;

  /**
   * Release a keep-alive task previously acquired with [acquireBackgroundTask] for [owner].
   * The native task is stopped only after all owners have released. No-op on iOS.
   * @param owner - The same key passed to [acquireBackgroundTask].
   */
  releaseBackgroundTask(owner: string): Promise<void>;

  /**
   * Fulfill or fail a pending CXAnswerCallAction on iOS.
   * Must be called after starting the JS-side joining process (e.g: without awaiting for call.join() to complete)
   * @param callId - The call id.
   * @param didFail - If true, calls action.fail(); otherwise calls action.fulfill().
   */
  fulfillAnswerCallAction(callId: string, didFail: boolean): void;

  /**
   * Fulfill or fail a pending CXEndCallAction on iOS.
   * Must be called after completetion of the JS-side processing (e.g: after call.leave() is done).
   * @param callId - The call id.
   * @param didFail - If true, calls action.fail(); otherwise calls action.fulfill().
   */
  fulfillEndCallAction(callId: string, didFail: boolean): void;

  registerVoipToken(): void;

  stopService(): Promise<void>;

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
  /**
   * Whether to enable ongoing calls.
   * @default false
   */
  enableOngoingCalls?: boolean;
  /**
   * When true, ringing pushes that arrive while the app is in the foreground
   * are not shown by CallKit. The push is still delivered to JS via
   * `voipNotificationReceived`, so the app must show its own ringing UI.
   * Background pushes are unaffected. Requires iOS 26.4+; no-op on older
   * versions.
   * @default false
   */
  skipIncomingPushInForeground?: boolean;
  /**
   * Default audio endpoint when CallKit activates the session.
   * `'earpiece'` omits `.defaultToSpeaker` for voice-only call UX.
   */
  defaultDeviceEndpointType?: DefaultDeviceEndpointType;
};
type iOSOptions = Omit<
  InternalIOSOptions,
  'maximumCallsPerCallGroup' | 'maximumCallGroups' | 'handleType'
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
  /**
   * Texts used for call state notifications while the system is connecting or declining the call.
   * If not provided, platform defaults will be used.
   */
  notificationTexts?: {
    /**
     * Text shown while optimistically accepting a call.
     * @default "Connecting..."
     */
    accepting?: string;
    /**
     * Text shown while optimistically rejecting a call.
     * @default "Declining..."
     */
    rejecting?: string;
  };
  /**
   * Whether to enable ongoing calls.
   * @default false
   */
  enableOngoingCalls?: boolean;
  /**
   * When true, incoming call push notifications (call.ring) will not be displayed
   * as a notification when the app is in the foreground.
   * @default false
   */
  skipIncomingPushInForeground?: boolean;
  /**
   * Default audio endpoint for Telecom-managed calls on Android.
   * Applied at call registration as `CallAttributesCompat.preferredStartingCallEndpoint`
   * Note: Works only before the call is registered.
   * @default 'speaker'
   */
  defaultDeviceEndpointType?: DefaultDeviceEndpointType;
};
type AndroidOptions = InternalAndroidOptions & NotificationTransformers;

export type NotificationTransformers = {
  titleTransformer?: (memberName: string, incoming: boolean) => string;
};

export type CallingExpOptions = {
  ios?: iOSOptions;
  android?: AndroidOptions;
  /**
   * Whether to reject calls when the user is busy.
   * @default false
   */
  shouldRejectCallWhenBusy?: boolean;
};

export type InfoDisplayOptions = {
  displayTitle?: string;
};

export type EventData = {
  [K in EventName]: { eventName: K; params: EventParams[K] };
}[EventName];

export type VoipEventData = {
  [K in VoipEventName]: { eventName: K; params: VoipEventParams[K] };
}[VoipEventName];

export type EventName =
  | 'answerCall'
  | 'endCall'
  | 'didDisplayIncomingCall'
  | 'didToggleHoldCallAction'
  | 'didChangeAudioRoute'
  | 'didAudioInterruption'
  | 'didReceiveStartCallAction'
  | 'didPerformSetMutedCallAction'
  | 'didActivateAudioSession'
  | 'didDeactivateAudioSession'
  | 'providerReset';

export type IOSAudioInterruptionEvent = {
  source: 'callingx';
  phase: 'began' | 'ended';
  reason?: 'default' | 'builtInMicMuted' | 'routeDisconnected' | (string & {});
  shouldResume?: boolean;
};

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
  didChangeAudioRoute: undefined;
  didAudioInterruption: IOSAudioInterruptionEvent;
  didReceiveStartCallAction: {
    callId: string;
  };
  didActivateAudioSession: undefined;
  didDeactivateAudioSession: undefined;
  providerReset: {
    callCids: string[];
  };
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
