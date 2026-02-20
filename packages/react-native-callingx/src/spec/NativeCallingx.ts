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
  }): void;

  setShouldRejectCallWhenBusy(shouldReject: boolean): void;

  canPostNotifications(): boolean;

  getInitialEvents(): Array<{
    eventName: string;
    params: {
      callId: string;
      cause?: string;
      muted?: boolean;
      hold?: boolean;
      source?: string;
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
      displaySubtitle?: string;
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
      displaySubtitle?: string;
    },
  ): Promise<void>;

  updateDisplay(
    callId: string,
    phoneNumber: string,
    callerName: string,
    displayOptions?: {
      displayTitle?: string;
      displaySubtitle?: string;
    },
  ): Promise<void>;

  isCallTracked(callId: string): boolean;

  hasRegisteredCall(): boolean;

  endCallWithReason(callId: string, reason: number): Promise<void>;

  endCall(callId: string): Promise<void>;

  setMutedCall(callId: string, isMuted: boolean): Promise<void>;

  setOnHoldCall(callId: string, isOnHold: boolean): Promise<void>;

  registerBackgroundTaskAvailable(): void;

  isServiceStarted(): Promise<boolean>;

  startBackgroundTask(taskName: string, timeout: number): Promise<void>;

  stopBackgroundTask(taskName: string): Promise<void>;

  registerVoipToken(): void;

  readonly onNewEvent: EventEmitter<{
    eventName: string;
    params: {
      callId: string;
      cause?: string;
      muted?: boolean;
      hold?: boolean;
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
