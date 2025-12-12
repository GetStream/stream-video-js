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
    setupAudioSession: boolean;
  }): void;

  setupAndroid(options: {
    incomingChannel: {
      id: string;
      name: string;
      sound: string;
      vibration: boolean;
    };
    outgoingChannel: {
      id: string;
      name: string;
    };
  }): void;

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

  clearInitialEvents(): Promise<void>;

  setCurrentCallActive(callId: string): Promise<void>;

  displayIncomingCall(
    callId: string,
    phoneNumber: string,
    callerName: string,
    hasVideo: boolean,
    displayOptions?: {
      displayTitle?: string;
      displaySubtitle?: string;
    }
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
    }
  ): Promise<void>;

  updateDisplay(
    callId: string,
    phoneNumber: string,
    callerName: string,
    displayOptions?: {
      displayTitle?: string;
      displaySubtitle?: string;
    }
  ): Promise<void>;

  isCallRegistered(callId: string): boolean;

  hasRegisteredCall(): boolean;

  endCallWithReason(callId: string, reason: number): Promise<void>;

  endCall(callId: string): Promise<void>;

  setMutedCall(callId: string, isMuted: boolean): Promise<void>;

  setOnHoldCall(callId: string, isOnHold: boolean): Promise<void>;

  startBackgroundTask(taskName: string, timeout: number): Promise<void>;

  stopBackgroundTask(taskName: string): Promise<void>;

  readonly onNewEvent: EventEmitter<{
    eventName: string;
    params: {
      callId: string;
      cause?: string;
      muted?: boolean;
      hold?: boolean;
    };
  }>;

  log(message: string, level: 'debug' | 'info' | 'warn' | 'error'): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('Callingx');
