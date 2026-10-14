import { TurboModuleRegistry, type TurboModule } from 'react-native';

// @ts-expect-error - CodegenTypes is not properly typed
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  setupiOS(options: {
    supportsVideo: boolean;
    maximumCallsPerCallGroup: number;
    maximumCallGroups: number;
    handleType: string;
    sound: string | null;
    imageName: string | null;
    callsHistory: boolean;
    displayCallTimeout: number;
    skipIncomingPushInForeground: boolean;
  }): boolean;

  setupAndroid(options: {
    incomingChannel: {
      id: string;
      name: string;
      sound: string;
      vibration: boolean;
    };
    ongoingChannel: {
      id: string;
      name: string;
    };
    notificationTexts?: {
      accepting?: string;
      rejecting?: string;
    };
    skipIncomingPushInForeground: boolean;
  }): boolean;

  wireAudioEngineSubscription(): boolean;

  unwireAudioEngineSubscription(): boolean;

  setShouldRejectCallWhenBusy(shouldReject: boolean): boolean;

  setDefaultAudioDeviceEndpointType(endpointType: string): boolean;

  canPostNotifications(): boolean;

  /**
   * Whether audio routing is backed by the Jetpack Telecom stack on this device.
   * Android: true on API 26+. iOS: always false (CallKit path uses its own bypass).
   */
  isTelecomBacked(): boolean;

  /** Call ids currently registered with Telecom (Android). Empty on iOS. */
  getRegisteredCallIds(): Array<string>;

  /**
   * Returns a JSON string snapshot `{ endpoints: [{id,name,type}], currentEndpoint }`
   * of the Telecom audio endpoints for the given call (Android). Returns an empty
   * snapshot on iOS / when the call is unknown.
   */
  getAvailableAudioEndpoints(callId: string): string;

  /** Requests a Telecom audio-endpoint change by endpoint id (Android). */
  requestAudioEndpointChange(callId: string, endpointId: string): boolean;

  getInitialEvents(): Array<{
    eventName: string;
    params: {
      callId?: string;
      cause?: string;
      muted?: boolean;
      hold?: boolean;
      source?: string;
      phase?: string;
      reason?: string;
      shouldResume?: boolean;
      // `ringCallPushReceived` — raw FCM `call.ring` data payload (Android)
      call_cid?: string;
      sender?: string;
      type?: string;
      created_by_id?: string;
      created_by_display_name?: string;
      call_display_name?: string;
      receiver_id?: string;
      video?: string;
      version?: string;
    };
  }>;

  getInitialVoipEvents(): Array<{
    eventName: string;
    params: {
      token?: string;
      aps?: {
        'thread-id': string;
        'mutable-content': number;
        alert: {
          title: string;
        };
        category: string;
        sound: string;
      };
      stream?: {
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
  }>;

  setCurrentCallActive(callId: string): boolean;

  displayIncomingCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
    displayOptions?: {
      displayTitle?: string;
    },
  ): Promise<void>;

  //use when need to answer an incoming call withing app UI
  answerIncomingCall(callId: string): boolean;

  startCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
    displayOptions?: {
      displayTitle?: string;
    },
  ): Promise<void>;

  updateDisplay(
    callId: string,
    phoneNumber: string,
    callerName: string,
    displayOptions?: {
      displayTitle?: string;
    },
  ): boolean;

  isCallTracked(callId: string): boolean;

  hasRegisteredCall(): boolean;

  endCallWithReason(callId: string, reason: number): boolean;

  endCall(callId: string): boolean;

  setMutedCall(callId: string, isMuted: boolean): boolean;

  setOnHoldCall(callId: string, isOnHold: boolean): boolean;

  startBackgroundTask(taskName: string, timeout: number): boolean;

  fulfillAnswerCallAction(callId: string, didFail: boolean): boolean;

  fulfillEndCallAction(callId: string, didFail: boolean): boolean;

  registerVoipToken(): boolean;

  stopService(): boolean;

  readonly onNewEvent: EventEmitter<{
    eventName: string;
    params: {
      callId?: string;
      cause?: string;
      muted?: boolean;
      hold?: boolean;
      source?: string;
      phase?: string;
      reason?: string;
      shouldResume?: boolean;
      // `ringCallPushReceived` — raw FCM `call.ring` data payload (Android)
      call_cid?: string;
      sender?: string;
      type?: string;
      created_by_id?: string;
      created_by_display_name?: string;
      call_display_name?: string;
      receiver_id?: string;
      video?: string;
      version?: string;
    };
  }>;

  readonly onNewVoipEvent: EventEmitter<{
    eventName: string;
    params: {
      token: string;
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
  }>;

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Callingx');
