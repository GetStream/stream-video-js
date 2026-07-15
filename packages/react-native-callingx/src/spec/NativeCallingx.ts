import {
  TurboModuleRegistry,
  NativeModules,
  type TurboModule,
} from 'react-native';

// @ts-expect-error - CodegenTypes is not properly typed
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';
import { isTurboModuleEnabled } from '../utils/utils';

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
  }): void;

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
  }): void;

  setShouldRejectCallWhenBusy(shouldReject: boolean): void;

  setDefaultAudioDeviceEndpointType(endpointType: string): void;

  canPostNotifications(): boolean;

  /**
   * Whether audio routing is backed by the Jetpack Telecom stack on this device.
   * Android: true on API 26+. iOS: always false (CallKit path uses its own bypass).
   */
  isTelecomBacked(): boolean;

  /** Call ids currently registered with Telecom (Android). Empty on iOS. */
  getRegisteredCallIds(): Array<string>;

  /**
   * Resolves a JSON string snapshot `{ endpoints: [{id,name,type}], currentEndpoint }`
   * of the Telecom audio endpoints for the given call (Android). Resolves an empty
   * snapshot on iOS / when the call is unknown.
   */
  getAvailableAudioEndpoints(callId: string): Promise<string>;

  /** Requests a Telecom audio-endpoint change by endpoint id (Android). */
  requestAudioEndpointChange(callId: string, endpointId: string): Promise<void>;

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
      snapshot?: string;
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

  setCurrentCallActive(callId: string): Promise<void>;

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
  answerIncomingCall(callId: string): Promise<void>;

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
  ): Promise<void>;

  isCallTracked(callId: string): boolean;

  hasRegisteredCall(): boolean;

  endCallWithReason(callId: string, reason: number): Promise<void>;

  endCall(callId: string): Promise<void>;

  setMutedCall(callId: string, isMuted: boolean): Promise<void>;

  setOnHoldCall(callId: string, isOnHold: boolean): Promise<void>;

  registerBackgroundTaskAvailable(): void;
  startBackgroundTask(taskName: string, timeout: number): Promise<void>;

  stopBackgroundTask(taskName: string): Promise<void>;

  fulfillAnswerCallAction(callId: string, didFail: boolean): void;

  fulfillEndCallAction(callId: string, didFail: boolean): void;

  registerVoipToken(): void;

  stopService(): Promise<void>;

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
      snapshot?: string;
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

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void;
}

const CallingxModule: Spec = isTurboModuleEnabled
  ? TurboModuleRegistry.getEnforcing<Spec>('Callingx')
  : (NativeModules.Callingx as Spec);

export default CallingxModule;
